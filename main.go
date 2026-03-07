package main

import (
	"embed"

	"guimd/backend"

	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"

	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := backend.NewApp()

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
					filePath, err := url.PathUnescape(strings.TrimPrefix(r.URL.Path, "/wails-local-file/"))
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
				http.NotFound(w, r)
			}),
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.Startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
