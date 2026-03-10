package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"

	"guimd/backend/internal/convert"
	"guimd/backend/internal/file"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
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
	path := filepath.Join("config", "default.json")
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var config map[string]interface{}
	if err := json.Unmarshal(content, &config); err != nil {
		return nil, err
	}
	return config, nil
}

// SaveConfig updates the default.json configuration
func (a *App) SaveConfig(config map[string]interface{}) error {
	path := filepath.Join("config", "default.json")
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

// LoadTranslations reads the corresponding language file from external/
// Falls back to embedded English if file not found or on error.
func (a *App) LoadTranslations(langCode string) (map[string]interface{}, error) {
	switch langCode {
	case "en-US", "en":
		return defaultEnglish, nil
	case "zh-TW", "zh_tw":
		return traditionalChinese, nil
	case "de":
		return german, nil
	}

	path := filepath.Join("external", fmt.Sprintf("%s.json", langCode))
	content, err := os.ReadFile(path)
	if err != nil {
		return defaultEnglish, nil
	}
	var translations map[string]interface{}
	if err := json.Unmarshal(content, &translations); err != nil {
		return defaultEnglish, nil
	}
	return translations, nil
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
	return "1.0.2"
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
	baseDir := filepath.Dir(filePath)
	// Replace src="relative/path" with src="file:///absolute/path"
	re := regexp.MustCompile(`src="([^"]+)"`)
	resolved := re.ReplaceAllStringFunc(html, func(match string) string {
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
	return resolved, nil
}

// reverseLocalFilePathsForDir rewrites src="/wails-local-file/<encoded>" back
// to a path relative to fileDir when possible, otherwise falls back to the
// decoded absolute path.
func reverseLocalFilePathsForDir(html, fileDir string) string {
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

// HtmlToMd converts HTML to markdown (absolute paths for images).
func (a *App) HtmlToMd(html string) (string, error) {
	return convert.HtmlToMd(reverseLocalFilePathsForDir(html, ""))
}

// HtmlToMdForFile converts HTML to markdown, restoring image paths relative
// to the given file path so the saved markdown stays portable.
func (a *App) HtmlToMdForFile(html, filePath string) (string, error) {
	fileDir := filepath.Dir(filePath)
	return convert.HtmlToMd(reverseLocalFilePathsForDir(html, fileDir))
}
