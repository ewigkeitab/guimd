import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { Typography } from '@tiptap/extension-typography';
import { useConfig } from '../contexts/ConfigContext';
import { MdToHtml, HtmlToMd, ResolveImagePath, UnresolveImagePath, GetRelativePath } from '../../wailsjs/go/backend/App';
import { SearchHighlight } from '../extensions/SearchHighlight';

interface EditorProps {
    content: string;
    onChange: (html: string, text: string) => void;
    onUpdate?: () => void;
    onSelectionUpdate?: () => void;
    scrollRef?: React.RefObject<HTMLDivElement>;
    onEditorReady?: (editor: Editor) => void;
    isViewMode?: boolean;
    onPrompt: (title: string, message: string, initialValue?: string) => Promise<string | null>;
    currentFile?: string | null;
}

/**
 * Heuristic: does the plain text look like Markdown?
 */
function looksLikeMarkdown(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;

    // Block-level indicators (start of line)
    if (/^#{1,6}\s/m.test(trimmed)) return true;        // headings
    if (/^[-*+]\s/m.test(trimmed)) return true;         // unordered list
    if (/^\d+\.\s/m.test(trimmed)) return true;         // ordered list
    if (/^>\s/m.test(trimmed)) return true;             // blockquote
    if (/^```/m.test(trimmed)) return true;             // fenced code block
    if (/^\|.+\|/m.test(trimmed)) return true;          // tables

    // Inline-level indicators (more specific to avoid single '*' false positives)
    if (/\*\*.+\*\*/.test(trimmed)) return true;        // bold
    if (/__[^_]+__/.test(trimmed)) return true;         // bold underscore
    if (/\[.+\]\(.+\)/.test(trimmed)) return true;      // links
    if (/`[^`]+`/.test(trimmed)) return true;           // inline code

    // Italic is tricky because a single * is common. Only match if it looks intentional.
    if (/\*[^*]+\*/.test(trimmed) && trimmed.includes(' ')) return true;

    return false;
}

export const MarkdownEditor: React.FC<EditorProps> = ({ content, onChange, onUpdate, onSelectionUpdate, scrollRef, onEditorReady, isViewMode = false, onPrompt, currentFile }) => {
    const { config } = useConfig();
    // Keep a stable ref to the editor so handlePaste can access it
    const editorRef = useRef<Editor | null>(null);
    const lastEditorContentRef = useRef<string>(content);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                link: {
                    openOnClick: false,
                    HTMLAttributes: {
                        class: 'guimd-link',
                    },
                },
            }),
            Table.configure({ resizable: false }),
            TableRow,
            TableHeader,
            TableCell,
            Image,
            TaskList,
            TaskItem.configure({ nested: true }),
            Typography,
            SearchHighlight,
        ],
        content: content,
        editable: !isViewMode,
        editorProps: {
            attributes: {
                class: 'guimd-editor-core',
            },
            handlePaste: (view, event) => {
                const clipboardData = event.clipboardData;
                if (!clipboardData) return false;

                // If clipboard contains HTML, let Tiptap handle it natively
                const htmlData = clipboardData.getData('text/html');
                if (htmlData && htmlData.trim().length > 0) {
                    return false;
                }

                // Plain text only — try to detect and convert Markdown
                const plainText = clipboardData.getData('text/plain');
                if (!plainText || plainText.trim().length === 0) return false;

                if (looksLikeMarkdown(plainText)) {
                    event.preventDefault();
                    MdToHtml(plainText).then((html) => {
                        if (!html) return;
                        
                        // Heuristic: if it's a single paragraph, let's see if we should unwrap it
                        // to avoid breaking the current line if pasting mid-sentence.
                        let processedHtml = html.trim();
                        const pMatch = processedHtml.match(/^<p>(.*)<\/p>$/is);
                        if (pMatch && !plainText.includes('\n')) {
                            processedHtml = pMatch[1];
                        }

                        // Use the view passed to handlePaste for safest insertion
                        const { state, dispatch } = view;
                        const { selection } = state;
                        const { from } = selection;

                        // Insert via Tiptap command if possible. editorRef.current should be set if the editor is interactive.
                        if (editorRef.current) {
                            editorRef.current.chain().focus().insertContent(processedHtml).run();
                        }
                    }).catch(err => {
                        console.error("Paste conversion error:", err);
                        // Fallback: just insert as plain text if conversion fails
                        if (editorRef.current) {
                            editorRef.current.chain().focus().insertContent(plainText).run();
                        }
                    });
                    return true;
                }

                // Plain text — let Tiptap insert it normally
                return false;
            },
        },
    });

    // Diagnostics: Log registered extensions to console
    useEffect(() => {
        if (editor) {
            console.log('Registered extensions:', editor.extensionManager.extensions.map(e => e.name));
        }
    }, [editor]);

    // Keep editorRef in sync with the Tiptap editor instance
    useEffect(() => {
        editorRef.current = editor;
        if (!editor) return;

        const handleUpdate = () => {
            const html = editor.getHTML();
            lastEditorContentRef.current = html;
            onChange(html, editor.getText());
            if (onUpdate) {
                onUpdate();
            }
        };

        const handleSelectionUpdateInner = () => {
            if (onSelectionUpdate) {
                onSelectionUpdate();
            }
        };

        editor.on('update', handleUpdate);
        editor.on('selectionUpdate', handleSelectionUpdateInner);
        return () => {
            editor.off('update', handleUpdate);
            editor.off('selectionUpdate', handleSelectionUpdateInner);
        };
    }, [editor, onChange, onUpdate, onSelectionUpdate]);

    // Intercept copy: write Markdown to clipboard as text/plain
    useEffect(() => {
        if (!editor) return;

        const handleCopy = (event: ClipboardEvent) => {
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed) return; // nothing selected

            event.preventDefault();

            // Serialize selected DOM nodes to HTML string
            const range = selection.getRangeAt(0);
            const container = document.createElement('div');
            container.appendChild(range.cloneContents());
            const selectedHtml = container.innerHTML;

            if (!selectedHtml.trim()) return;

            // Set HTML immediately via clipboardData (synchronous)
            event.clipboardData!.setData('text/html', selectedHtml);
            event.clipboardData!.setData('text/plain', selection.toString());

            // Async: convert to Markdown then overwrite clipboard text/plain
            HtmlToMd(selectedHtml).then((md) => {
                navigator.clipboard.write([
                    new ClipboardItem({
                        'text/plain': new Blob([md], { type: 'text/plain' }),
                        'text/html': new Blob([selectedHtml], { type: 'text/html' }),
                    }),
                ]).catch(() => {
                    navigator.clipboard.writeText(md).catch(console.error);
                });
            });
        };

        let el: HTMLElement | undefined;
        try {
            el = editor.view.dom;
        } catch {
            return; // view proxy throws if not yet mounted
        }
        if (!el) return;
        el.addEventListener('copy', handleCopy as EventListener);

        const handleImageEdit = async (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'IMG') {
                event.preventDefault();
                const currentWailsSrc = (target as HTMLImageElement).getAttribute('src') || '';
                
                // 1. Unwrap the wails path to get absolute absolute path
                let displayPath = await UnresolveImagePath(currentWailsSrc);
                
                // 2. Try to make it relative for the user to see/edit
                if (currentFile) {
                    displayPath = await GetRelativePath(currentFile, displayPath);
                }

                const newPath = await onPrompt('Edit Image URL', 'Enter image path (absolute or relative):', displayPath);
                
                if (newPath !== null && newPath !== displayPath) {
                    // 3. Resolve it back to a wails path for immediate display
                    const newWailsSrc = await ResolveImagePath(currentFile || '', newPath);
                    
                    const pos = editor.view.posAtDOM(target, 0);
                    if (pos >= 0) {
                        editor.chain().focus().setNodeSelection(pos).updateAttributes('image', { src: newWailsSrc }).run();
                    }
                }
            }
        };

        el.addEventListener('dblclick', handleImageEdit);
        el.addEventListener('contextmenu', handleImageEdit);

        return () => {
            el!.removeEventListener('copy', handleCopy as EventListener);
            el!.removeEventListener('dblclick', handleImageEdit);
            el!.removeEventListener('contextmenu', handleImageEdit);
        };
    }, [editor, onPrompt, currentFile]);

    useEffect(() => {
        if (editor && content !== lastEditorContentRef.current) {
            lastEditorContentRef.current = content;
            editor.commands.setContent(content, { emitUpdate: true });
        }
    }, [content, editor]);

    useEffect(() => {
        if (editor) {
            editor.setEditable(!isViewMode);
        }
    }, [isViewMode, editor]);

    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    if (!editor) {
        return null;
    }

    return (
        <div
            className="guimd-editor-container"
            style={{
                fontFamily: config?.editor.fontFamily,
                fontSize: `${config?.editor.fontSize}px`,
            }}
        >
            {/* scroll wrapper — this is what scrolls */}
            <div className="guimd-editor-scroll" ref={scrollRef}>
                <EditorContent editor={editor} className="guimd-editor-content" />
            </div>
        </div>
    );
};
