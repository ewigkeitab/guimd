package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// LoadConfig reads the default.json configuration
func LoadConfig() (map[string]interface{}, error) {
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
func SaveConfig(config map[string]interface{}) error {
	path := filepath.Join("config", "default.json")
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}
