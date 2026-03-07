package file

import (
	"os"
)

// ReadFile reads the content of a file
func ReadFile(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// SaveFile writes content to a file
func SaveFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}
