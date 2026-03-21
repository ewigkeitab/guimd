import React from 'react';
import { Editor } from '@tiptap/react';
import { useI18n } from '../contexts/I18nContext';
import { ResolveImagePath } from '../../wailsjs/go/backend/App';

interface ToolbarProps {
    editor: Editor | null;
    isViewMode: boolean;
    onToggleViewMode: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onPrompt: (title: string, message: string, initialValue?: string) => Promise<string | null>;
    onLinkPrompt: (title: string, initialText?: string, initialUrl?: string) => Promise<{ text: string, url: string } | null>;
    currentFile?: string | null;
}

// SVG icon components
const Icon = {
    Bold: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        </svg>
    ),
    Italic: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
        </svg>
    ),
    Underline: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
            <line x1="4" y1="21" x2="20" y2="21" />
        </svg>
    ),
    H1: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h8M4 5v14M12 5v14" />
            <text x="17" y="19" fontSize="12" fontWeight="bold" stroke="none" fill="currentColor">1</text>
        </svg>
    ),
    H2: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h8M4 5v14M12 5v14" />
            <text x="17" y="19" fontSize="12" fontWeight="bold" stroke="none" fill="currentColor">2</text>
        </svg>
    ),
    H3: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h8M4 5v14M12 5v14" />
            <text x="17" y="19" fontSize="12" fontWeight="bold" stroke="none" fill="currentColor">3</text>
        </svg>
    ),
    BulletList: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
    ),
    OrderedList: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <text x="1" y="8" fontSize="8" fontWeight="bold" stroke="none" fill="currentColor">1.</text>
            <text x="1" y="14" fontSize="8" fontWeight="bold" stroke="none" fill="currentColor">2.</text>
            <text x="1" y="20" fontSize="8" fontWeight="bold" stroke="none" fill="currentColor">3.</text>
        </svg>
    ),
    TaskList: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
    ),
    Quote: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
        </svg>
    ),
    Code: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    ),
    Table: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
    ),
    AddRowBefore: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
            <path d="M4 14h16" />
            <path d="M10 14v3" />
            <path d="M14 14v3" />
            <path d="M12 4v6" />
            <path d="M9 7h6" />
        </svg>
    ),
    AddRowAfter: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1" />
            <path d="M4 10h16" />
            <path d="M10 7v3" />
            <path d="M14 7v3" />
            <path d="M12 14v6" />
            <path d="M9 17h6" />
        </svg>
    ),
    DeleteRow: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
            <path d="M4 10V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1" />
            <path d="M4 10h16" />
            <path d="M4 14h16" />
            <path d="M10 7v7" />
            <path d="M14 7v7" />
            <path d="M8 12h8" color="red" />
        </svg>
    ),
    AddColumnBefore: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 4h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-1" />
            <path d="M14 4v16" />
            <path d="M14 10h3" />
            <path d="M14 14h3" />
            <path d="M4 12h6" />
            <path d="M7 9v6" />
        </svg>
    ),
    AddColumnAfter: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 4H9a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h1" />
            <path d="M10 4v16" />
            <path d="M10 10H7" />
            <path d="M10 14H7" />
            <path d="M14 12h6" />
            <path d="M17 9v6" />
        </svg>
    ),
    DeleteColumn: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 4h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-1" />
            <path d="M10 4H9a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h1" />
            <path d="M10 4v16" />
            <path d="M14 4v16" />
            <path d="M7 10h7" />
            <path d="M7 14h7" />
            <path d="M12 8v8" color="red" />
        </svg>
    ),
    DeleteTable: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
            <line x1="6" y1="6" x2="18" y2="18" color="red" />
            <line x1="18" y1="6" x2="6" y2="18" color="red" />
        </svg>
    ),
    Link: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    Image: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    ),
    Eye: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    FontIncrease: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <text x="2" y="19" fontSize="16" fontWeight="bold" stroke="none" fill="currentColor">A</text>
            <line x1="15" y1="11" x2="23" y2="11" />
            <line x1="19" y1="7" x2="19" y2="15" />
        </svg>
    ),
    FontDecrease: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <text x="2" y="19" fontSize="16" fontWeight="bold" stroke="none" fill="currentColor">A</text>
            <line x1="15" y1="11" x2="23" y2="11" />
        </svg>
    ),
    HorizontalRule: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
    ),
};

interface TBtnProps {
    title: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
}

const TBtn: React.FC<TBtnProps> = ({ title, onClick, active, disabled, children }) => (
    <button
        className={`guimd-tbtn${active ? ' active' : ''}`}
        onClick={onClick}
        title={title}
        aria-label={title}
        disabled={disabled}
    >
        {children}
    </button>
);

export const Toolbar: React.FC<ToolbarProps> = ({ editor, isViewMode, onToggleViewMode, onZoomIn, onZoomOut, onPrompt, onLinkPrompt, currentFile }) => {
    const { t } = useI18n();

    if (!editor) return null;

    return (
        <div className="guimd-toolbar-container">
            <div className={`guimd-toolbar-floating ${isViewMode ? 'active' : ''}`}>
                <TBtn
                    title={t('toolbar.editMode')}
                    onClick={onToggleViewMode}
                    active={true}
                >
                    <Icon.Eye />
                </TBtn>
            </div>

            <div className={`guimd-toolbar ${!isViewMode ? 'active' : ''}`}>
            <TBtn title={t('toolbar.bold')} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} disabled={isViewMode}>
                <Icon.Bold />
            </TBtn>
            <TBtn title={t('toolbar.italic')} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} disabled={isViewMode}>
                <Icon.Italic />
            </TBtn>
            <TBtn title={t('toolbar.underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} disabled={isViewMode}>
                <Icon.Underline />
            </TBtn>

            <span className="guimd-toolbar-sep" />

            <TBtn title={t('toolbar.h1')} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} disabled={isViewMode}>
                <Icon.H1 />
            </TBtn>
            <TBtn title={t('toolbar.h2')} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} disabled={isViewMode}>
                <Icon.H2 />
            </TBtn>
            <TBtn title={t('toolbar.h3')} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} disabled={isViewMode}>
                <Icon.H3 />
            </TBtn>

            <span className="guimd-toolbar-sep" />

            <TBtn title={t('toolbar.bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} disabled={isViewMode}>
                <Icon.BulletList />
            </TBtn>
            <TBtn title={t('toolbar.orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} disabled={isViewMode}>
                <Icon.OrderedList />
            </TBtn>
            <TBtn title={t('toolbar.taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} disabled={isViewMode}>
                <Icon.TaskList />
            </TBtn>

            <span className="guimd-toolbar-sep" />

            <TBtn title={t('toolbar.blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} disabled={isViewMode}>
                <Icon.Quote />
            </TBtn>
            <TBtn title={t('toolbar.codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} disabled={isViewMode}>
                <Icon.Code />
            </TBtn>
            <TBtn title={t('toolbar.horizontalRule')} onClick={() => editor.chain().focus().setHorizontalRule().run()} disabled={isViewMode}>
                <Icon.HorizontalRule />
            </TBtn>

            <span className="guimd-toolbar-sep" />

            <TBtn title={t('toolbar.table')} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} disabled={isViewMode}>
                <Icon.Table />
            </TBtn>

            {editor.isActive('table') && (
                <>
                    <span className="guimd-toolbar-sep" style={{ margin: '0 4px', background: 'rgba(50,50,50,0.2)' }} />
                    <TBtn title={t('toolbar.table.addRowBefore')} onClick={() => editor.chain().focus().addRowBefore().run()} disabled={isViewMode}>
                        <Icon.AddRowBefore />
                    </TBtn>
                    <TBtn title={t('toolbar.table.addRowAfter')} onClick={() => editor.chain().focus().addRowAfter().run()} disabled={isViewMode}>
                        <Icon.AddRowAfter />
                    </TBtn>
                    <TBtn title={t('toolbar.table.deleteRow')} onClick={() => editor.chain().focus().deleteRow().run()} disabled={isViewMode}>
                        <Icon.DeleteRow />
                    </TBtn>
                    <span className="guimd-toolbar-sep" style={{ margin: '0 4px', background: 'rgba(50,50,50,0.2)' }} />
                    <TBtn title={t('toolbar.table.addColumnBefore')} onClick={() => editor.chain().focus().addColumnBefore().run()} disabled={isViewMode}>
                        <Icon.AddColumnBefore />
                    </TBtn>
                    <TBtn title={t('toolbar.table.addColumnAfter')} onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={isViewMode}>
                        <Icon.AddColumnAfter />
                    </TBtn>
                    <TBtn title={t('toolbar.table.deleteColumn')} onClick={() => editor.chain().focus().deleteColumn().run()} disabled={isViewMode}>
                        <Icon.DeleteColumn />
                    </TBtn>
                    <span className="guimd-toolbar-sep" style={{ margin: '0 4px', background: 'rgba(50,50,50,0.2)' }} />
                    <TBtn title={t('toolbar.table.deleteTable')} onClick={() => editor.chain().focus().deleteTable().run()} disabled={isViewMode}>
                        <Icon.DeleteTable />
                    </TBtn>
                    <span className="guimd-toolbar-sep" style={{ margin: '0 4px', background: 'rgba(50,50,50,0.2)' }} />
                </>
            )}

            <TBtn
                title={t('toolbar.link')}
                onClick={async () => {
                    let initialText = '';
                    let initialUrl = '';

                    if (editor.isActive('link')) {
                        // Get current link info
                        initialUrl = editor.getAttributes('link').href || '';
                        
                        // Extract text of the link
                        const { from, to } = editor.state.selection;
                        // Temp extend to get full link text
                        editor.chain().extendMarkRange('link').run();
                        initialText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
                        // If we didn't actually select anything or it's empty, use original from/to
                    } else if (!editor.state.selection.empty) {
                        initialText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
                    }

                    const result = await onLinkPrompt(t('prompt.link_title'), initialText, initialUrl);

                    if (result === null) {
                        return;
                    }

                    if (result.url === '') {
                        editor.chain().focus().extendMarkRange('link').unsetLink().run();
                        return;
                    }

                    // Update or insert link
                    const { text, url } = result;
                    editor.chain().focus().extendMarkRange('link').insertContent({
                        type: 'text',
                        text: text || url,
                        marks: [{ type: 'link', attrs: { href: url } }]
                    }).run();
                }}
                active={editor.isActive('link')}
                disabled={isViewMode}
            >
                <Icon.Link />
            </TBtn>
            <TBtn
                title={t('toolbar.image')}
                onClick={async () => {
                    const path = await onPrompt(t('prompt.image_title'), t('prompt.image_msg'), '');
                    if (path) {
                        // Resolve path (especially relative ones) to /wails-local-file/ URI
                        const resolvedSrc = await ResolveImagePath(currentFile || '', path);
                        editor.chain().focus().setImage({ src: resolvedSrc }).run();
                    }
                }}
            >
                <Icon.Image />
            </TBtn>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
                <span className="guimd-toolbar-sep" style={{ margin: '0 4px' }} />
                <TBtn title={t('toolbar.zoomOut')} onClick={onZoomOut}>
                    <Icon.FontDecrease />
                </TBtn>
                <TBtn title={t('toolbar.zoomIn')} onClick={onZoomIn}>
                    <Icon.FontIncrease />
                </TBtn>

                <span className="guimd-toolbar-sep" style={{ margin: '0 4px' }} />

                <TBtn
                    title={isViewMode ? t('toolbar.editMode') : t('toolbar.viewMode')}
                    onClick={onToggleViewMode}
                    active={isViewMode}
                >
                    <Icon.Eye />
                </TBtn>
            </div>
        </div>
    </div>
);
};
