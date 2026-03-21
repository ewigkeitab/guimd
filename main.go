package main

import (
	"embed"

	"guimd/backend"

	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"

	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := backend.NewApp()

	// Check for command line arguments (Windows/Linux)
	if len(os.Args) > 1 {
		arg := os.Args[1]
		// Check if it's a file path (not a flag)
		if !strings.HasPrefix(arg, "-") {
			// Basic check if file exists
			if absPath, err := filepath.Abs(arg); err == nil {
				if _, err := os.Stat(absPath); err == nil {
					app.OnFileOpen(absPath)
				}
			}
		}
	}

	// Define application menu
	appMenu := menu.NewMenu()
	if runtime.GOOS == "darwin" {
		appMenu.Append(menu.AppMenu())
	}
	fileMenu := appMenu.AddSubmenu("File")
	fileMenu.AddText("New Window", keys.Combo("n", keys.CmdOrCtrlKey, keys.ShiftKey), func(_ *menu.CallbackData) {
		app.NewWindow("")
	})
	
	appMenu.Append(menu.EditMenu())

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "guimd",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
			Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if strings.HasPrefix(r.URL.Path, "/wails-local-file/") {
					// Extract absolute path
					// Extract absolute path.
					escapedPath := strings.TrimPrefix(r.URL.Path, "/wails-local-file/")
					filePath, err := url.PathUnescape(escapedPath)
					if err != nil {
						http.Error(w, err.Error(), http.StatusBadRequest)
						return
					}
					// Serve file
					data, err := os.ReadFile(filePath)
					if err != nil {
						http.Error(w, err.Error(), http.StatusNotFound)
						return
					}
					w.Write(data)
					return
				}
				// By not writing anything here, we let the default Wails asset serving handle the request.
			}),
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.Startup,
		OnBeforeClose:    app.BeforeClose,
		Menu:             appMenu,
		Mac: &mac.Options{
			About: &mac.AboutInfo{
				Title:   "guimd",
				Message: "© 2024 chen chien hung",
			},
			OnFileOpen: app.OnFileOpen,
		},
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop:     false,
			DisableWebViewDrop: true,
		},
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
