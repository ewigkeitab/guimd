import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
    RefreshCcw, ChevronUp, ChevronDown,
    FilePlus, FolderOpen, History, Save, Download,
    Search, Palette, Languages, Info, HelpCircle,
    Sun, Moon, Monitor, Feather, Trash2, FileText, Globe
} from 'lucide-react';
import { useConfig } from './contexts/ConfigContext';
import { useI18n } from './contexts/I18nContext';
import { MarkdownEditor } from './components/Editor';
import { MenuBar, MenuItemDef } from './components/MenuBar';
import { Toolbar } from './components/Toolbar';
import { AboutDialog } from './components/AboutDialog';
import { HelpDialog } from './components/HelpDialog';
import { InputDialog } from './components/InputDialog';
import { ConfirmDialog } from './components/ConfirmDialog';
import { LinkDialog } from './components/LinkDialog';
import { FindReplaceDialog } from './components/FindReplaceDialog';
import { SaveFile, ReadFile, OpenFileDialog, SaveFileDialog, MdToHtml, MdToHtmlWithBase, HtmlToMd, HtmlToMdForFile, GetPendingFile, SetDirty } from '../wailsjs/go/backend/App';
import { EventsOn } from '../wailsjs/runtime';

export const MainLayout: React.FC = () => {
    const { config, updateConfig } = useConfig();
    const { t } = useI18n();
    const [content, setContent] = useState('');
    const [currentFile, setCurrentFile] = useState<string | null>(null);
    const [recentFiles, setRecentFiles] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('guimd-recent-files') || '[]');
        } catch { return []; }
    });
    const [statusMsg, setStatusMsg] = useState('');
    const [aboutOpen, setAboutOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [version, setVersion] = useState('1.1.5');
    const [systemIsDark, setSystemIsDark] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [isJustLoaded, setIsJustLoaded] = useState(true);
    const [, setForceUpdate] = useState({});
    const [wordCount, setWordCount] = useState(0);
    const [lineCount, setLineCount] = useState(0);
    const [isViewMode, setIsViewMode] = useState(false);
    const [inputDialog, setInputDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        initialValue: string;
        resolve: (val: string | null) => void;
    }>({ open: false, title: '', message: '', initialValue: '', resolve: () => { } });
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        resolve: (val: boolean) => void;
    }>({ open: false, title: '', message: '', resolve: () => { } });
    const [linkDialog, setLinkDialog] = useState<{
        open: boolean;
        title: string;
        initialText: string;
        initialUrl: string;
        resolve: (val: { text: string, url: string } | null) => void;
    }>({ open: false, title: '', initialText: '', initialUrl: '', resolve: () => { } });
    const editorScrollRef = React.useRef<HTMLDivElement>(null);

    // Status bar enhancements
    const [cursorInfo, setCursorInfo] = useState({ line: 1, col: 1, selected: 0 });
    const [structureOpen, setStructureOpen] = useState(false);
    const [headings, setHeadings] = useState<{ level: number; text: string; pos: number; line: number }[]>([]);

    // Find/Replace state
    const [findReplaceOpen, setFindReplaceOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<{ from: number; to: number }[]>([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
    const [findBarInitialQuery, setFindBarInitialQuery] = useState('');

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setSystemIsDark(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const showStatus = (msg: string) => {
        setStatusMsg(msg);
        setTimeout(() => setStatusMsg(''), 3000);
    };

    const addRecentFile = (path: string) => {
        setRecentFiles(prev => {
            const next = [path, ...prev.filter(p => p !== path)].slice(0, 5);
            localStorage.setItem('guimd-recent-files', JSON.stringify(next));
            return next;
        });
    };

    const updateCounts = useCallback((text: string) => {
        // Line count
        const lines = text === '' ? 0 : text.split('\n').length;
        setLineCount(lines);

        // Word count with basic CJK support
        // Matches CJK characters individually or sequences of alphanumeric/hyphenated words
        const matches = text.match(/[\u4e00-\u9fa5]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uac00-\ud7af]|[\w\u00C0-\u024F'-]+/g);
        setWordCount(matches ? matches.length : 0);
    }, []);

    const handlePrompt = useCallback((title: string, message: string, initialValue: string = ''): Promise<string | null> => {
        if (editor) editor.commands.blur();
        return new Promise((resolve) => {
            setInputDialog({
                open: true,
                title,
                message,
                initialValue,
                resolve
            });
        });
    }, []);

    const handleLinkPrompt = useCallback((title: string, initialText: string = '', initialUrl: string = ''): Promise<{ text: string, url: string } | null> => {
        if (editor) editor.commands.blur();
        return new Promise((resolve) => {
            setLinkDialog({
                open: true,
                title,
                initialText,
                initialUrl,
                resolve
            });
        });
    }, []);

    const handleConfirm = useCallback((title: string, message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmDialog({
                open: true,
                title,
                message,
                resolve
            });
        });
    }, []);

    // Initial word count when editor is first ready or file loaded
    useEffect(() => {
        if (editor) {
            updateCounts(editor.getText());
        }
    }, [editor, updateCounts]);
    const scrollToTop = useCallback(() => {
        if (editorScrollRef.current) {
            editorScrollRef.current.scrollTop = 0;
        }
    }, []);
    const handleNew = useCallback(async () => {
        if (isDirty) {
            const confirmed = await handleConfirm(t('confirm.unsaved_changes_title'), t('confirm.unsaved_changes'));
            if (!confirmed) return;
        }
        setIsJustLoaded(true);
        setContent('');
        setCurrentFile(null);
        setIsDirty(false);
        setWordCount(0);
        setLineCount(0);
        scrollToTop();
    }, [isDirty, t, handleConfirm, scrollToTop]);

    // Wrapper passed to the editor — every editor-originated change marks the doc dirty
    const handleContentChange = useCallback((html: string, text: string) => {
        setContent(html);
        if (isJustLoaded) {
            setIsDirty(false);

        } else {
            setIsDirty(true);
        }
        setIsJustLoaded(false);
        updateCounts(text);
    }, [isJustLoaded, updateCounts]);

    const handleUpdate = useCallback(() => {
        if (!editor) return;

        const newHeadings: { level: number; text: string; pos: number; line: number }[] = [];
        const fullText = editor.getText();

        editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'heading') {
                const textBefore = editor.state.doc.textBetween(0, pos, '\n');
                const line = textBefore.split('\n').length;
                newHeadings.push({ level: node.attrs.level, text: node.textContent, pos, line });
            }
        });
        setHeadings(newHeadings);
    }, [editor]);

    const handleSelectionUpdate = useCallback(() => {
        if (!editor) return;

        const { from, to } = editor.state.selection;

        // Calculate line and col based on text before cursor
        const textBefore = editor.state.doc.textBetween(0, from, '\n');
        const lines = textBefore.split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1; // +1 for 1-based indexing

        // Calculate selection length
        const selectedText = editor.state.doc.textBetween(from, to, '\n');
        const selected = selectedText.length;

        setCursorInfo({ line, col, selected });

        // Check if cursor moved outside the current search match
        if (findReplaceOpen && searchResults.length > 0 && currentSearchIndex >= 0) {
            const match = searchResults[currentSearchIndex];
            if (from < match.from || to > match.to) {
                // User clicked away, don't clear results but maybe reset index
                // For simplicity, keep the results until they search again
            }
        }
        setFindBarInitialQuery(selectedText);
        setForceUpdate({});
    }, [editor, findReplaceOpen, searchResults, currentSearchIndex]);

    const loadFileByPath = useCallback(async (path: string) => {
        if (isDirty) {
            const confirmed = await handleConfirm(t('confirm.unsaved_changes_title'), t('confirm.unsaved_changes'));
            if (!confirmed) return;
        }
        try {
            const raw = await ReadFile(path);
            const html = await MdToHtmlWithBase(raw, path);
            setIsJustLoaded(true);
            setContent(html);
            setCurrentFile(path);
            setIsDirty(false);
            addRecentFile(path);
            scrollToTop();
        } catch (err: any) {
            window.alert(t('error.loadRecentFile') || `Failed to open file:\n${path}\n\n${err.message || err}`);
        }
    }, [isDirty, t, handleConfirm, addRecentFile, scrollToTop]);

    useEffect(() => {
        SetDirty(isDirty);
    }, [isDirty]);

    useEffect(() => {
        const quitOnOpenFile = EventsOn('open-file', (path: string) => {
            loadFileByPath(path);
        });

        // Also check if there's a file path pending from startup
        GetPendingFile().then((path: string) => {
            if (path) {
                loadFileByPath(path);
            }
        });

        return () => {
            quitOnOpenFile();
        };
    }, [loadFileByPath]);

    const handleOpen = useCallback(async () => {
        if (isDirty) {
            const confirmed = await handleConfirm(t('confirm.unsaved_changes_title'), t('confirm.unsaved_changes'));
            if (!confirmed) return;
        }
        const path = await OpenFileDialog();
        if (!path) return;
        const raw = await ReadFile(path);
        // Use MdToHtmlWithBase so relative image paths resolve correctly
        const html = await MdToHtmlWithBase(raw, path);
        setIsJustLoaded(true);
        setContent(html);
        setCurrentFile(path);
        setIsDirty(false);
        addRecentFile(path);
        scrollToTop();
    }, [isDirty, t, handleConfirm, addRecentFile, scrollToTop]);

    const handleReload = useCallback(async () => {
        console.log('handleReload');
        if (!currentFile) return;
        if (isDirty) {
            const confirmed = await handleConfirm(t('confirm.reload_title'), t('confirm.reload'));
            if (!confirmed) {
                return;
            }
        }
        const raw = await ReadFile(currentFile);
        const html = await MdToHtmlWithBase(raw, currentFile);
        setIsJustLoaded(true);
        setContent(html);
        setIsDirty(false);
        showStatus(t('status.reloaded'));
    }, [currentFile, isDirty, t]);

    const handleSaveAs = useCallback(async () => {
        const path = await SaveFileDialog();
        if (!path) return;
        const md = await HtmlToMdForFile(content, path);
        await SaveFile(path, md);
        setCurrentFile(path);
        addRecentFile(path);
        setIsDirty(false);
        showStatus(t('status.saved'));
    }, [content, t]);

    const handleSave = useCallback(async () => {
        if (!currentFile) {
            const path = await SaveFileDialog();
            if (!path) return;
            const md = await HtmlToMdForFile(content, path);
            await SaveFile(path, md);
            setCurrentFile(path);
            addRecentFile(path);
            setIsDirty(false);
            showStatus(t('status.saved'));
            return;
        }
        const md = await HtmlToMdForFile(content, currentFile);
        await SaveFile(currentFile, md);
        setIsDirty(false);
        showStatus(t('status.saved'));
    }, [currentFile, content, t]);



    // Precise scroll helper using coordsAtPos for better accuracy especially near document end
    const scrollToPos = useCallback((pos: number) => {
        if (!editor || !editorScrollRef.current) return;
        try {
            const { view } = editor;
            const scrollContainer = editorScrollRef.current;

            // coordsAtPos returns viewport-relative coordinates
            const coords = view.coordsAtPos(pos);
            const containerRect = scrollContainer.getBoundingClientRect();

            // Distance from the top of the visible container to the target position
            const currentRelativeTop = coords.top - containerRect.top;

            // Target scrollTop: current + (relative distance) - buffer (48px)
            const targetScrollTop = scrollContainer.scrollTop + currentRelativeTop - 48;

            scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
        } catch (e) {
            console.error("Failed to scroll to pos", e);
        }
    }, [editor]);

    // Find / Replace logic
    const executeSearch = useCallback((query: string, matchCase: boolean, reverse: boolean = false) => {
        if (!editor || !query) {
            setSearchResults([]);
            setCurrentSearchIndex(-1);
            if (editor) {
                editor.commands.clearSearchInfo();
            }
            return;
        }

        try {
            const textContent = editor.getText();
            let regexFlags = 'g';
            if (!matchCase) regexFlags += 'i';

            // Escape query for regex
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedQuery, regexFlags);

            const results: { from: number; to: number }[] = [];

            // Tiptap's doc.descendants is more reliable for finding absolute positions
            // However, a simple approach is to use the text and map it back, but Tiptap nodes
            // can make mapping text -> pos tricky due to node boundaries.
            // Let's use Tiptap's built-in text search trick by iterating over text nodes.
            let posOffset = 1; // start of doc usually
            editor.state.doc.descendants((node, pos) => {
                if (node.isText && node.text) {
                    let text = node.text;
                    let match;
                    // regex.lastIndex = 0 is needed if we reuse it
                    const localRegex = new RegExp(escapedQuery, regexFlags);
                    while ((match = localRegex.exec(text)) !== null) {
                        results.push({
                            from: pos + match.index,
                            to: pos + match.index + match[0].length
                        });
                    }
                }
            });

            setSearchResults(results);

            if (results.length > 0) {
                let nextIndex = 0;

                // If we already have a focused match, find the next one
                if (currentSearchIndex >= 0 && currentSearchIndex < results.length) {
                    if (reverse) {
                        nextIndex = currentSearchIndex - 1;
                        if (nextIndex < 0) nextIndex = results.length - 1;
                    } else {
                        nextIndex = currentSearchIndex + 1;
                        if (nextIndex >= results.length) nextIndex = 0;
                    }
                }

                setCurrentSearchIndex(nextIndex);
                // Update highlights
                editor.commands.setSearchInfo(query, matchCase, nextIndex);

                // Select the match (optional: we can just scroll, but selecting causes issues if typing. We will JUST scroll)
                const match = results[nextIndex];

                // Wait briefly for DOM to sync and scroll
                setTimeout(() => {
                    scrollToPos(match.from);
                }, 10);
            } else {
                if (editor) editor.commands.clearSearchInfo();
                setCurrentSearchIndex(-1);
            }
        } catch (e) {
            console.error("Search error:", e);
        }
    }, [editor, currentSearchIndex]);

    const handleReplace = useCallback((query: string, replacement: string, matchCase: boolean) => {
        if (!editor || !query || searchResults.length === 0 || currentSearchIndex < 0) return;

        const match = searchResults[currentSearchIndex];

        // Delete the exact match range and insert the replacement
        editor.chain()
            .deleteRange({ from: match.from, to: match.to })
            .insertContentAt(match.from, replacement)
            .run();

        // Search again to update positions
        setTimeout(() => executeSearch(query, matchCase, false), 50);
    }, [editor, searchResults, currentSearchIndex, executeSearch]);

    const handleReplaceAll = useCallback((query: string, replacement: string, matchCase: boolean) => {
        if (!editor || !query) return;

        let regexFlags = 'g';
        if (!matchCase) regexFlags += 'i';
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedQuery, regexFlags);

        // A trick to replace all is to get HTML, replace text outside tags, and set it back.
        // It's safer to use Tiptap commands if possible, but stepping backwards is safer for pos changes.
        // To be completely safe with Tiptap, we should do it as a single transaction iterating backwards.
        const { state, view } = editor;
        const tr = state.tr;

        const matches: { from: number, to: number }[] = [];
        state.doc.descendants((node, pos) => {
            if (node.isText && node.text) {
                let localRegex = new RegExp(escapedQuery, regexFlags);
                let m;
                while ((m = localRegex.exec(node.text)) !== null) {
                    matches.push({
                        from: pos + m.index,
                        to: pos + m.index + m[0].length
                    });
                }
            }
        });

        // Replace from last to first so indices don't shift
        matches.reverse().forEach(match => {
            tr.replaceWith(match.from, match.to, state.schema.text(replacement));
        });

        if (matches.length > 0) {
            view.dispatch(tr);
            showStatus(`${t('status.replacedAll')} (${matches.length})`); setSearchResults([]);
            setCurrentSearchIndex(-1);
        }
    }, [editor, t]);

    // Global keyboard shortcuts
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) return;
            switch (e.key.toLowerCase()) {
                case 'n':
                    e.preventDefault();
                    handleNew();
                    break;
                case 'o':
                    e.preventDefault();
                    handleOpen();
                    break;
                case 's':
                    e.preventDefault();
                    if (e.shiftKey) {
                        handleSaveAs();
                    } else {
                        handleSave();
                    }
                    break;
                case 'f':
                    e.preventDefault();
                    setFindReplaceOpen(true);
                    break;
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleNew, handleOpen, handleSave, handleSaveAs]);

    const handleThemeChange = (theme: string) => {
        if (config) {
            updateConfig({ editor: { ...config.editor, theme } });
        }
    };

    const handleLanguageChange = (language: string) => {
        if (config) {
            updateConfig({ language });
        }
    };

    const handleZoomIn = useCallback(() => {
        if (config && config.editor) {
            const currentSize = config.editor.fontSize || 16;
            updateConfig({ editor: { ...config.editor, fontSize: Math.min(currentSize + 2, 48) } });
        }
    }, [config, updateConfig]);

    const handleZoomOut = useCallback(() => {
        if (config && config.editor) {
            const currentSize = config.editor.fontSize || 16;
            updateConfig({ editor: { ...config.editor, fontSize: Math.max(currentSize - 2, 8) } });
        }
    }, [config, updateConfig]);


    if (!config || !config.layout || !config.editor) {
        return <div className="guimd-config-error">{t('error.config')}</div>;
    }

    let themeClass = 'guimd-light';
    if (config.editor.theme === 'system') {
        themeClass = systemIsDark ? 'guimd-dark' : 'guimd-light';
    } else if (config.editor.theme === 'dark') {
        themeClass = 'guimd-dark';
    } else if (config.editor.theme === 'epaper') {
        themeClass = 'guimd-electric-paper';
    }

    const recentFileItems: MenuItemDef[] = recentFiles.length === 0
        ? [{ label: t('menu.noRecentFiles'), disabled: true }]
        : [
            ...recentFiles.map(p => ({
                label: p.split(/[/\\]/).pop() ?? p,
                title: p,
                icon: <FileText size={14} />,
                action: () => loadFileByPath(p),
            })),
            { separator: true as const },
            {
                label: t('menu.clearRecentFiles'),
                icon: <Trash2 size={14} />,
                action: () => {
                    setRecentFiles([]);
                    localStorage.removeItem('guimd-recent-files');
                },
            },
        ];

    const menus = [
        {
            label: "",//t('menu.file'),
            icon: <FilePlus size={14} />,
            items: [
                { label: `${t('menu.new')}\t⌃N`, icon: <FilePlus size={14} />, action: handleNew },
                { label: `${t('menu.open')}\t⌃O`, icon: <FolderOpen size={14} />, action: handleOpen },
                { label: t('menu.recentFiles'), icon: <History size={14} />, items: recentFileItems },
                { separator: true },
                { label: `${t('menu.save')}\t⌃S`, icon: <Save size={14} />, action: handleSave },
                { label: `${t('menu.saveAs')}\t⌃⇧S`, icon: <Download size={14} />, action: handleSaveAs },
            ],
        },
        {
            label: "",//t('menu.view'),
            icon: <Palette size={14} />,
            items: [
                { label: `${t('menu.find') || 'Find/Replace'}\t⌃F`, icon: <Search size={14} />, action: () => setFindReplaceOpen(true) },
                { separator: true },
                {
                    label: t('menu.theme'),
                    icon: <Palette size={14} />,
                    items: [
                        { label: t('menu.theme.light'), icon: <Sun size={14} />, action: () => handleThemeChange('light') },
                        { label: t('menu.theme.dark'), icon: <Moon size={14} />, action: () => handleThemeChange('dark') },
                        { label: t('menu.theme.system'), icon: <Monitor size={14} />, action: () => handleThemeChange('system') },
                        { label: t('menu.theme.epaper'), icon: <Feather size={14} />, action: () => handleThemeChange('epaper') },
                    ]
                },
                {
                    label: t('menu.language'),
                    icon: <Languages size={14} />,
                    items: [
                        { label: t('menu.language.en'), icon: <Globe size={14} />, action: () => handleLanguageChange('en') },
                        { label: t('menu.language.zh_tw'), icon: <Globe size={14} />, action: () => handleLanguageChange('zh-TW') },
                        { label: t('menu.language.de'), icon: <Globe size={14} />, action: () => handleLanguageChange('de') },
                    ]
                }
            ],
        },
        {
            label: "",//t('menu.help'),
            icon: <HelpCircle size={14} />,
            items: [
                { label: t('menu.about'), icon: <Info size={14} />, action: () => setAboutOpen(true) },
                { label: t('menu.help_page'), icon: <HelpCircle size={14} />, action: () => setHelpOpen(true) },
            ],
        },
    ];

    return (
        <div className={`guimd-layout ${themeClass}`}>
            <div className="guimd-header">
                <MenuBar menus={menus} />
                {currentFile && (
                    <div className="guimd-header-info">
                        <div
                            className="guimd-filepath"
                            title={t('tooltip.copyPath') || 'Click to copy path'}
                            onClick={() => {
                                navigator.clipboard.writeText(currentFile);
                                showStatus(t('status.copied') || 'Path copied to clipboard');
                            }}
                        >
                            {currentFile}
                        </div>
                        <button
                            title={t('tooltip.reloadFile') || 'Reload file'}
                            className="guimd-reload-btn"
                            onClick={handleReload}
                        >
                            <RefreshCcw size={14} />
                        </button>
                    </div>
                )}
            </div>
            <Toolbar
                editor={editor}
                isViewMode={isViewMode}
                onToggleViewMode={() => setIsViewMode(prev => !prev)}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onPrompt={handlePrompt}
                onLinkPrompt={handleLinkPrompt}
                currentFile={currentFile}
            />

            <div className={`guimd-workspace layout-${config.layout.type}`}>
                {/* {config.layout.sidebarPosition === 'left' && (
                    <div className="guimd-sidebar" style={{ width: config.layout.sidebarWidth }}>
                        <div className="guimd-sidebar-title">Explorer</div>
                    </div>
                )} */}

                <div className="guimd-main-pane">
                    <MarkdownEditor
                        content={content}
                        onChange={handleContentChange}
                        onUpdate={handleUpdate}
                        onSelectionUpdate={handleSelectionUpdate}
                        scrollRef={editorScrollRef}
                        onEditorReady={setEditor}
                        isViewMode={isViewMode}
                        onPrompt={handlePrompt}
                        currentFile={currentFile}
                    />
                    <FindReplaceDialog
                        open={findReplaceOpen}
                        initialQuery={findBarInitialQuery}
                        onClose={() => {
                            setFindReplaceOpen(false);
                            setFindBarInitialQuery('');
                            if (editor) editor.commands.clearSearchInfo();
                        }}
                        onFindNext={(q, mc) => executeSearch(q, mc, false)}
                        onFindPrev={(q, mc) => executeSearch(q, mc, true)}
                        onReplace={handleReplace}
                        onReplaceAll={handleReplaceAll}
                        matchCount={searchResults.length}
                        currentMatch={currentSearchIndex >= 0 ? currentSearchIndex + 1 : 0}
                    />
                </div>
            </div>

            <div className="guimd-statusbar">
                <span className="guimd-status-left">
                    {isDirty && (
                        <span className="guimd-status-modified">{t('status.modified')}</span>
                    )}
                    {statusMsg
                        ? <span className="guimd-status-notify">{statusMsg}</span>
                        : !isDirty && <span className="guimd-status-ready">{t('status.ready')}</span>
                    }
                </span>
                <span className="guimd-status-right">
                    {currentFile && (
                        <span
                            className="guimd-status-file"
                            title={t('tooltip.copyFilename')}
                            onClick={() => {
                                const filename = currentFile.split(/[/\\]/).pop() || '';
                                navigator.clipboard.writeText(filename);
                                showStatus(t('status.copied'));
                            }}
                        >
                            {currentFile.split(/[/\\]/).pop()}
                        </span>
                    )}

                    <span className="guimd-status-sep">·</span>
                    <span
                        className="guimd-status-structure-btn"
                        onClick={() => setStructureOpen(!structureOpen)}
                        title={t('structure.title')}
                    >
                        {t('status.index')}
                        {structureOpen ? <ChevronDown size={14} style={{ marginLeft: '4px' }} /> : <ChevronUp size={14} style={{ marginLeft: '4px' }} />}
                    </span>

                    <span className="guimd-status-sep">·</span>
                    <span>{wordCount} {t('status.words')} </span>
                    <span className="guimd-status-sep">·</span>
                    <span>{lineCount} {t('status.lines')} </span>
                    <span className="guimd-status-sep">·</span>
                    <span>{t('status.line')} {cursorInfo.line}, {t('status.col')} {cursorInfo.col}</span>
                    {cursorInfo.selected > 0 && (
                        <span> ({cursorInfo.selected} {t('status.selected')})</span>
                    )}
                </span>
            </div>
            {/** todo: add a little "up" to the structure button to hint     that it can be closed or open */}
            {/* Structure Popup */}
            {structureOpen && (
                <>
                    <div
                        className="guimd-dialog-overlay"
                        style={{ background: 'transparent' }}
                        onClick={() => setStructureOpen(false)}
                    />
                    <div className="guimd-structure-popup">
                        <div className="guimd-structure-header">
                            {t('structure.title')}
                        </div>
                        <div className="guimd-structure-list">
                            {headings.length === 0 ? (
                                <div className="guimd-structure-empty">{t('structure.empty')}</div>
                            ) : (
                                headings.map((h, i) => (
                                    <div
                                        key={`${h.pos}-${i}`}
                                        className={`guimd-structure-item level-${h.level}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (editor) {
                                                setStructureOpen(false);
                                                // Place selection first
                                                editor.commands.setTextSelection(h.pos);
                                                // Focus the editor
                                                editor.commands.focus();
                                                // Then force our precise scroll
                                                setTimeout(() => {
                                                    scrollToPos(h.pos);
                                                }, 10);
                                            }
                                        }}
                                    >
                                        <span className="guimd-structure-text">
                                            {h.text || `${t('structure.heading')} ${h.level}`}
                                        </span>
                                        <span className="guimd-structure-line">
                                            {t('status.line')} {h.line}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            <AboutDialog
                open={aboutOpen}
                onClose={() => setAboutOpen(false)}
                version={version}
                onCopy={(text) => {
                    navigator.clipboard.writeText(text);
                    showStatus(t('status.copied'));
                }}
            />
            <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
            <InputDialog
                open={inputDialog.open}
                title={inputDialog.title}
                message={inputDialog.message}
                initialValue={inputDialog.initialValue}
                onConfirm={(val) => {
                    setInputDialog(prev => ({ ...prev, open: false }));
                    inputDialog.resolve(val);
                }}
                onCancel={() => {
                    setInputDialog(prev => ({ ...prev, open: false }));
                    inputDialog.resolve(null);
                }}
            />
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={() => {
                    setConfirmDialog(prev => ({ ...prev, open: false }));
                    confirmDialog.resolve(true);
                }}
                onCancel={() => {
                    setConfirmDialog(prev => ({ ...prev, open: false }));
                    confirmDialog.resolve(false);
                }}
            />
            <LinkDialog
                open={linkDialog.open}
                title={linkDialog.title}
                initialText={linkDialog.initialText}
                initialUrl={linkDialog.initialUrl}
                onConfirm={(text, url) => {
                    setLinkDialog(prev => ({ ...prev, open: false }));
                    linkDialog.resolve({ text, url });
                }}
                onCancel={() => {
                    setLinkDialog(prev => ({ ...prev, open: false }));
                    linkDialog.resolve(null);
                }}
            />
        </div>
    );
};
