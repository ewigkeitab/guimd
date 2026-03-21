package pathutil

import (
	"fmt"
	"net/url"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
)

// ResolveImagePath takes a platform-specific path (relative or absolute)
// and returns the /wails-local-file/ URI for display in the editor.
func ResolveImagePath(baseFilePath, imgPath string) string {
	if strings.HasPrefix(imgPath, "http://") || strings.HasPrefix(imgPath, "https://") ||
		strings.HasPrefix(imgPath, "file://") || strings.HasPrefix(imgPath, "data:") {
		return imgPath
	}
	// If it's already a wails path, return as is
	if strings.HasPrefix(imgPath, "/wails-local-file/") {
		return imgPath
	}

	absPath := imgPath
	if !filepath.IsAbs(imgPath) && baseFilePath != "" {
		absPath = filepath.Join(filepath.Dir(baseFilePath), imgPath)
	}
	
	return fmt.Sprintf("/wails-local-file/%s", url.PathEscape(absPath))
}

// UnresolveImagePath takes a /wails-local-file/ URI and returns the absolute system path.
// If it's not a wails path, it returns the input as is.
func UnresolveImagePath(wailsPath string) string {
	if !strings.HasPrefix(wailsPath, "/wails-local-file/") {
		return wailsPath
	}
	
	escapedPath := strings.TrimPrefix(wailsPath, "/wails-local-file/")
	absPath, err := url.PathUnescape(escapedPath)
	if err != nil {
		return wailsPath
	}
	
	if runtime.GOOS == "windows" {
		absPath = strings.ReplaceAll(absPath, "/", "\\")
	}
	return absPath
}

// GetRelativePath returns the relative path from baseDir to targetPath if possible,
// otherwise returns the absolute path.
func GetRelativePath(baseFilePath, targetPath string) string {
	if baseFilePath == "" {
		return targetPath
	}
	baseDir := filepath.Dir(baseFilePath)
	rel, err := filepath.Rel(baseDir, targetPath)
	if err != nil {
		return targetPath
	}
	return filepath.ToSlash(rel)
}

// ResolveImagesInHtml rewrites src="relative/path" to src="/wails-local-file/<absolute>"
func ResolveImagesInHtml(html, baseFilePath string) string {
	baseDir := filepath.Dir(baseFilePath)
	re := regexp.MustCompile(`src="([^"]+)"`)
	return re.ReplaceAllStringFunc(html, func(match string) string {
		sub := re.FindStringSubmatch(match)
		if len(sub) < 2 {
			return match
		}
		src := sub[1]
		// Leave absolute URLs and file:// URIs unchanged
		if strings.HasPrefix(src, "http://") || strings.HasPrefix(src, "https://") ||
			strings.HasPrefix(src, "file://") || strings.HasPrefix(src, "data:") {
			return match
		}
		// Resolve relative path to absolute
		absPath := filepath.Join(baseDir, src)
		// URL escape the path for use in the custom URI
		escapedPath := url.PathEscape(absPath)
		return fmt.Sprintf(`src="/wails-local-file/%s"`, escapedPath)
	})
}

// ReverseLocalFilePathsInHtml rewrites src="/wails-local-file/<encoded>" back
// to a path relative to fileDir when possible.
func ReverseLocalFilePathsInHtml(html, fileDir string) string {
	re := regexp.MustCompile(`src="/wails-local-file/([^"]+)"`)
	return re.ReplaceAllStringFunc(html, func(match string) string {
		sub := re.FindStringSubmatch(match)
		if len(sub) < 2 {
			return match
		}
		absPath, err := url.PathUnescape(sub[1])
		if err != nil {
			return match
		}
		if runtime.GOOS == "windows" {
			absPath = strings.ReplaceAll(absPath, "/", "\\")
		}
		if fileDir != "" {
			if rel, err := filepath.Rel(fileDir, absPath); err == nil {
				// Convert to forward slashes for portable markdown output
				return fmt.Sprintf(`src="%s"`, filepath.ToSlash(rel))
			}
		}
		// Convert to forward slashes if desired, or keep absolute path as is
		return fmt.Sprintf(`src="%s"`, filepath.ToSlash(absPath))
	})
}
