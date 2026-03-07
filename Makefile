# Guimd Makefile

WAILS := $(shell which wails 2>/dev/null || echo $(HOME)/go/bin/wails)
TAGS := -tags webkit2gtk_4.1
RELEASE_DIR := release
# BUILD_FLAGS := -obfuscated -upx # Requires 'garble' and 'upx' installed. (Garble requires Go 1.25)
BUILD_FLAGS := -upx -ldflags="-s -w"
export PATH := $(HOME)/go/bin:$(PATH)
export PKG_CONFIG_PATH := $(CURDIR)/.pkgconfig:$(PKG_CONFIG_PATH)

VERSION := $(shell grep '"version":' frontend/package.json | cut -d '"' -f 4)

.PHONY: all dev build build-linux build-windows build-darwin build-all \
	package-linux package-windows package-darwin package-all \
	clean install-deps deps-go deps-frontend generate prep-release

all: package-all

# Install all dependencies
install-deps: deps-go deps-frontend

# Install Go dependencies
deps-go:
	go mod download

# Install frontend dependencies
deps-frontend:
	cd frontend && npm install

# Run the application in development mode
dev:
	$(WAILS) dev

# Build the application for the current platform
build: generate
	$(WAILS) build $(BUILD_FLAGS) $(TAGS)

# Build for Linux
build-linux: generate
	$(WAILS) build -platform linux/amd64 $(BUILD_FLAGS) $(TAGS)

# Build for Windows (requires mingw-w64 and nsis)
# Use: sudo apt install nsis g++-mingw-w64-x86-64
build-windows: generate
	$(WAILS) build -platform windows/amd64 $(BUILD_FLAGS)

# Build for macOS (Universal binary, requires macOS + Xcode)
build-darwin: generate
	$(WAILS) build -platform darwin/universal $(BUILD_FLAGS)

# Build for all supported platforms
build-all: build-linux build-windows build-darwin

# --- Deployment Packaging ---

# Ensure release directory exists
prep-release:
	mkdir -p $(RELEASE_DIR)

# Package for Linux (generates .deb/.rpm)
package-linux: generate prep-release
	$(WAILS) build -platform linux/amd64 $(BUILD_FLAGS) $(TAGS)
	mv build/bin/guimd* $(RELEASE_DIR)/ 2>/dev/null || true
	cd $(RELEASE_DIR) && zip -r guimd-v$(VERSION)-linux-amd64.zip guimd* -x "*.zip"

# Package for Windows (generates NSIS installer)
package-windows: generate prep-release
	$(WAILS) build -platform windows/amd64 -nsis $(BUILD_FLAGS)
	mv build/bin/guimd*-installer.exe $(RELEASE_DIR)/ 2>/dev/null || true
	cd $(RELEASE_DIR) && zip -r guimd-v$(VERSION)-windows-amd64.zip guimd*.exe -x "*.zip"

# Package for macOS (generates .dmg for universal binary)
package-darwin: generate prep-release
	$(WAILS) build -platform darwin/universal $(BUILD_FLAGS)
	mv build/bin/guimd*.dmg $(RELEASE_DIR)/ 2>/dev/null || true
	cd $(RELEASE_DIR) && zip -r guimd-v$(VERSION)-darwin-universal.zip guimd*.app -x "*.zip"

# Package for all platforms
package-all: package-linux package-windows package-darwin

# Generate Wails bindings and frontend assets
generate:	
	cd frontend && npm run build && cd ..
	$(WAILS) generate module


# Clean build artifacts
clean:
	rm -rf build/bin
	rm -rf $(RELEASE_DIR)
	cd frontend && rm -rf dist
