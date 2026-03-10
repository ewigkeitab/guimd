import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { Typography } from '@tiptap/extension-typography';
import { Underline } from '@tiptap/extension-underline';
import { useConfig } from '../contexts/ConfigContext';
import { MdToHtml, HtmlToMd } from '../../wailsjs/go/backend/App';
import { SearchHighlight } from '../extensions/SearchHighlight';

interface EditorProps {
    content: string;
    onChange: (html: string, text: string) => void;
    onSelectionUpdate?: () => void;
    scrollRef?: React.RefObject<HTMLDivElement>;
    onEditorReady?: (editor: Editor) => void;
    isViewMode?: boolean;
}

/**
 * Heuristic: does the plain text look like Markdown?
 */
function looksLikeMarkdown(text: string): boolean {
    return /^#{1,6}\s/m.test(text)        // headings
        || /\*\*.+\*\*/m.test(text)        // bold
        || /\*.+\*/m.test(text)            // italic
        || /^[-*+]\s/m.test(text)          // unordered list
        || /^\d+\.\s/m.test(text)          // ordered list
        || /^>\s/m.test(text)              // blockquote
        || /`[^`]+`/m.test(text)           // inline code
        || /^```/m.test(text)              // fenced code block
        || /\[.+\]\(.+\)/m.test(text)      // links
        || /^\|.+\|/m.test(text);          // tables
}

export const MarkdownEditor: React.FC<EditorProps> = ({ content, onChange, onSelectionUpdate, scrollRef, onEditorReady, isViewMode = false }) => {
    const { config } = useConfig();
    // Keep a stable ref to the editor so handlePaste can access it
    const editorRef = useRef<Editor | null>(null);
    const lastEditorContentRef = useRef<string>(content);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Image,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'guimd-link',
                },
            }),
            Underline,
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
            handlePaste: (_view, event) => {
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
                const isMD = looksLikeMarkdown(plainText)
                console.log('isMD', isMD)
                if (isMD) {
                    event.preventDefault();
                    MdToHtml(plainText).then((html) => {
                        editorRef.current?.chain().focus().insertContent(html).run();
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
        };

        const handleTransaction = () => {
            if (onSelectionUpdate) {
                onSelectionUpdate();
            }
        };

        editor.on('update', handleUpdate);
        editor.on('transaction', handleTransaction);
        return () => {
            editor.off('update', handleUpdate);
            editor.off('transaction', handleTransaction);
        };
    }, [editor, onChange, onSelectionUpdate]);

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
        return () => el!.removeEventListener('copy', handleCopy as EventListener);
    }, [editor]);

    useEffect(() => {
        if (editor && content !== lastEditorContentRef.current) {
            lastEditorContentRef.current = content;
            editor.commands.setContent(content, { emitUpdate: false });
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
