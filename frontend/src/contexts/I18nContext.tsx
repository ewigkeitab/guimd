import React, { createContext, useContext, useEffect, useState } from 'react';
import { LoadTranslations } from '../../wailsjs/go/backend/App';
import { useConfig } from './ConfigContext';

interface I18nContextProps {
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextProps>({ t: (k) => k });

const defaultTranslations: Record<string, string> = {
    "menu.file": "File",
    "menu.open": "Open",
    "menu.save": "Save",
    "menu.saveAs": "Save As",
    "menu.new": "New",
    "menu.help": "Help",
    "menu.view": "View",
    "menu.theme": "Theme",
    "menu.theme.light": "Light",
    "menu.theme.dark": "Dark",
    "menu.theme.system": "System",
    "menu.theme.epaper": "E-Paper",
    "menu.about": "About Guimd",
    "menu.recentFiles": "Recent Files",
    "menu.noRecentFiles": "No recent files",
    "menu.clearRecentFiles": "Clear Recent Files",
    "menu.help_page": "Help",
    "menu.language": "Language",
    "menu.language.en": "English",
    "menu.language.zh_tw": "繁體中文",
    "menu.language.de": "Deutsch",
    "editor.placeholder": "Start typing your text here...",
    "status.saved": "File Saved",
    "status.reloaded": "File reloaded",
    "status.copied": "Copied to clipboard",
    "status.modified": "Modified",
    "status.ready": "Ready",
    "status.index": "Index",
    "status.words": "W",
    "status.lines": "L",
    "status.line": "Ln",
    "status.col": "Col",
    "status.selected": "selected",
    "error.loadRecentFile": "Failed to open recent file. It may have been moved or deleted.",
    "error.config": "Configuration Error: Layout or Editor settings missing.",
    "confirm.unlink": "Are you sure you want to remove this link?",
    "confirm.reload": "The file has unsaved changes. Are you sure you want to reload?",
    "about.title": "About Guimd",
    "about.tagline": "Cross-platform Markdown editor",
    "about.author": "Author",
    "about.logo_alt": "Guimd Logo",
    "common.close": "Close",
    "common.cancel": "Cancel",
    "common.ok": "OK",
    "help.title": "Guimd Help",
    "help.writing": "Writing Markdown",
    "help.writing_desc": "You can use the toolbar or keyboard shortcuts to format your text.",
    "help.shortcuts": "Keyboard Shortcuts",
    "help.features": "Features",
    "help.h1": "H1 Header",
    "help.h2": "H2 Header",
    "help.bold": "Bold text",
    "help.italic": "Italic text",
    "help.link": "Link",
    "help.image": "Image",
    "help.ul": "Unordered list",
    "help.ol": "Ordered list",
    "help.code": "In-line code",
    "help.codeblock": "Code block",
    "help.quote": "Blockquote",
    "help.hr": "Horizontal rule",
    "help.feature.themes": "Multiple themes",
    "help.feature.wysiwyg": "WYSIWYG Markdown editing",
    "help.feature.lightweight": "Lightweight and fast",
    "help.feature.crossplatform": "Cross-platform (macOS, Windows, Linux)",
    "structure.title": "Document Structure",
    "structure.empty": "No headings found",
    "structure.heading": "Heading",
    "tooltip.copyPath": "Click to copy path",
    "tooltip.reloadFile": "Reload file",
    "tooltip.copyFilename": "Click to copy filename",
    "toolbar.bold": "Bold",
    "toolbar.italic": "Italic",
    "toolbar.underline": "Underline",
    "toolbar.h1": "Heading 1",
    "toolbar.h2": "Heading 2",
    "toolbar.h3": "Heading 3",
    "toolbar.bulletList": "Bullet List",
    "toolbar.orderedList": "Numbered List",
    "toolbar.taskList": "Task List",
    "toolbar.blockquote": "Blockquote",
    "toolbar.codeBlock": "Code Block",
    "toolbar.table": "Table",
    "toolbar.link": "Link",
    "toolbar.image": "Image",
    "toolbar.zoomIn": "Increase Font Size",
    "toolbar.zoomOut": "Decrease Font Size",
    "toolbar.editMode": "Edit Mode",
    "toolbar.viewMode": "View Mode",
    "prompt.link_title": "Insert Link",
    "prompt.link_msg": "Enter the URL for this link:",
    "prompt.image_title": "Insert Image",
    "prompt.image_msg": "Enter the URL or path for the image:",
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { config } = useConfig();
    const [translations, setTranslations] = useState<Record<string, string>>(defaultTranslations); useEffect(() => {
        if (config.language) {
            LoadTranslations(config.language).then(data => {
                setTranslations(prev => ({ ...prev, ...data }));
            }).catch(console.error);
        }
    }, [config.language]);
    const t = (key: string) => {
        return translations[key] || key;
    };

    return (
        <I18nContext.Provider value={{ t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => useContext(I18nContext);
