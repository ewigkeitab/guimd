import React, { createContext, useContext, useEffect, useState } from 'react';
import { LoadConfig, SaveConfig } from '../../wailsjs/go/backend/App';

interface LayoutConfig {
  type: string;
  primary: string;
  secondary: string;
  sidebarPosition: string;
  sidebarWidth: number;
}

interface EditorConfig {
  theme: string;
  fontSize: number;
  fontFamily: string;
}

interface Config {
  layout: LayoutConfig;
  editor: EditorConfig;
  language: string;
}

interface ConfigContextProps {
  config: Config;
  updateConfig: (newConfig: Partial<Config>) => void;
}

const defaultLayout: Config = {
  layout: { type: 'split-pane', primary: 'editor', secondary: 'sidebar', sidebarPosition: 'right', sidebarWidth: 100 },
  editor: { theme: 'epaper', fontSize: 14, fontFamily: 'Inter, sans-serif' },
  language: 'en-US',
};

const ConfigContext = createContext<ConfigContextProps>({ config: defaultLayout, updateConfig: () => { } });

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<Config>(defaultLayout);
  useEffect(() => {
    LoadConfig().then(cfg => {
      if (cfg) setConfig(cfg as Config);
    }).catch(console.error);
  }, []);
  const updateConfig = (newCfg: Partial<Config>) => {
    setConfig(prev => {
      const merged = { ...prev, ...newCfg };
      SaveConfig(merged).catch(console.error);
      return merged;
    });
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
