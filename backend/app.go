package backend

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"runtime"
	"strings"

	"guimd/backend/internal/config"
	"guimd/backend/internal/convert"
	"guimd/backend/internal/file"
	"guimd/backend/internal/i18n"
	"guimd/backend/internal/pathutil"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx             context.Context
	pendingFilePath string
	isDirty         bool
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// Startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// OnFileOpen is called when a file is opened via the OS (macOS)
func (a *App) OnFileOpen(filePath string) {
	if a.ctx != nil {
		// If the app is already running, open the file in a new instance/window
		a.NewWindow(filePath)
	} else {
		a.pendingFilePath = filePath
	}
}

// GetPendingFile returns the file path that was requested to be opened before context was ready
func (a *App) GetPendingFile() string {
	path := a.pendingFilePath
	a.pendingFilePath = ""
	return path
}

// ReadFile reads the content of a file
func (a *App) ReadFile(path string) (string, error) {
	return file.ReadFile(path)
}

// SaveFile writes content to a file
func (a *App) SaveFile(path string, content string) error {
	return file.SaveFile(path, content)
}

// LoadConfig reads the default.json configuration
func (a *App) LoadConfig() (map[string]interface{}, error) {
	return config.LoadConfig()
}

// SaveConfig updates the default.json configuration
func (a *App) SaveConfig(configData map[string]interface{}) error {
	return config.SaveConfig(configData)
}

// LoadTranslations reads the corresponding language file from external/
// Falls back to embedded English if file not found or on error.
func (a *App) LoadTranslations(langCode string) (map[string]interface{}, error) {
	return i18n.LoadTranslations(langCode)
}

// OpenFileDialog opens a native file picker and returns the selected file path
func (a *App) OpenFileDialog() (string, error) {
	return wruntime.OpenFileDialog(a.ctx, wruntime.OpenDialogOptions{
		Title: "Open File",
		Filters: []wruntime.FileFilter{
			{DisplayName: "Markdown Files (*.md)", Pattern: "*.md"},
			{DisplayName: "All Files (*.*)", Pattern: "*.*"},
		},
	})
}

// SaveFileDialog opens a native save dialog and returns the chosen path
func (a *App) SaveFileDialog() (string, error) {
	return wruntime.SaveFileDialog(a.ctx, wruntime.SaveDialogOptions{
		Title:           "Save File",
		DefaultFilename: "untitled.md",
		Filters: []wruntime.FileFilter{
			{DisplayName: "Markdown Files (*.md)", Pattern: "*.md"},
		},
	})
}

// GetAppVersion returns the current application version string
func (a *App) GetAppVersion() string {
	return "1.1.5"
}

// MdToHtml converts markdown to HTML
func (a *App) MdToHtml(md string) (string, error) {
	return convert.MdToHtml(md)
}

// MdToHtmlWithBase converts markdown to HTML, resolving relative image paths
// to absolute file:// URIs based on the given file's directory.
func (a *App) MdToHtmlWithBase(md string, filePath string) (string, error) {
	html, err := convert.MdToHtml(md)
	if err != nil {
		return "", err
	}
	return pathutil.ResolveImagesInHtml(html, filePath), nil
}

// HtmlToMd converts HTML to markdown (absolute paths for images).
func (a *App) HtmlToMd(html string) (string, error) {
	return convert.HtmlToMd(pathutil.ReverseLocalFilePathsInHtml(html, ""))
}

// HtmlToMdForFile converts HTML to markdown, restoring image paths relative
// to the given file path so the saved markdown stays portable.
func (a *App) HtmlToMdForFile(html, filePath string) (string, error) {
	fileDir := filepath.Dir(filePath)
	return convert.HtmlToMd(pathutil.ReverseLocalFilePathsInHtml(html, fileDir))
}

// ResolveImagePath takes a platform-specific path (relative or absolute)
// and returns the /wails-local-file/ URI for display in the editor.
func (a *App) ResolveImagePath(baseFilePath, imgPath string) string {
	return pathutil.ResolveImagePath(baseFilePath, imgPath)
}

// UnresolveImagePath takes a /wails-local-file/ URI and returns the absolute system path.
// If it's not a wails path, it returns the input as is.
func (a *App) UnresolveImagePath(wailsPath string) string {
	return pathutil.UnresolveImagePath(wailsPath)
}

// GetRelativePath returns the relative path from baseDir to targetPath if possible,
// otherwise returns the absolute path.
func (a *App) GetRelativePath(baseFilePath, targetPath string) string {
	return pathutil.GetRelativePath(baseFilePath, targetPath)
}

// NewWindow launches a new instance of the application
func (a *App) NewWindow(filePath string) {
	exe, err := os.Executable()
	if err != nil {
		fmt.Printf("Error getting executable path: %v\n", err)
		return
	}

	var cmd *exec.Cmd
	// On macOS, if we are running from an app bundle, use 'open -n' to force a new instance
	if runtime.GOOS == "darwin" && strings.Contains(exe, ".app/Contents/MacOS/") {
		appPath := strings.Split(exe, ".app/Contents/MacOS/")[0] + ".app"
		args := []string{"-n", appPath}
		if filePath != "" {
			args = append(args, "--args", filePath)
		}
		cmd = exec.Command("open", args...)
	} else {
		if filePath != "" {
			cmd = exec.Command(exe, filePath)
		} else {
			cmd = exec.Command(exe)
		}
	}

	err = cmd.Start()
	if err != nil {
		fmt.Printf("Error starting new window: %v\n", err)
	}
}

// SetDirty updates the application's dirty state from the frontend
func (a *App) SetDirty(dirty bool) {
	a.isDirty = dirty
}

// BeforeClose is called when the application is about to close.
func (a *App) BeforeClose(ctx context.Context) bool {
	if a.isDirty {
		selection, _ := wruntime.MessageDialog(ctx, wruntime.MessageDialogOptions{
			Type:          wruntime.QuestionDialog,
			Title:         "Unsaved Changes",
			Message:       "The file has unsaved changes. Are you sure you want to quit?",
			DefaultButton: "No",
			Buttons:       []string{"Yes", "No"},
		})
		return selection == "No"
	}
	return false
}
