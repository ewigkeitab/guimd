import React, { useRef, useEffect, useCallback } from 'react';
import { useConfig } from '../contexts/ConfigContext';

interface MinimapProps {
    content: string;
    editorScrollRef: React.RefObject<HTMLDivElement>;
}

export const Minimap: React.FC<MinimapProps> = ({ content, editorScrollRef }) => {
    const { config } = useConfig();
    const minimapRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    // Find the actual scrollable div (.guimd-editor-scroll inside the editor container)
    const getScrollEl = useCallback((): HTMLDivElement | null => {
        const container = editorScrollRef.current;
        if (!container) return null;
        // editorScrollRef now points to guimd-editor-container; we need the inner scroll wrapper
        const inner = container.querySelector<HTMLDivElement>('.guimd-editor-scroll');
        return inner ?? (container as HTMLDivElement);
    }, [editorScrollRef]);

    useEffect(() => {
        const minimap = minimapRef.current;
        const viewport = viewportRef.current;
        if (!minimap || !viewport) return;

        let animFrame: number | null = null;

        const updateViewport = () => {
            const scrollEl = getScrollEl();
            if (!scrollEl || !minimap) return;

            const contentEl = minimap.querySelector('.guimd-minimap-content') as HTMLElement;
            if (!contentEl || !minimap || !viewport) return;

            const { scrollTop, scrollHeight, clientHeight } = scrollEl;

            // The scale defined in CSS (transform: scale(0.25))
            const minScale = 0.25;

            // Expected height of the content in the minimap
            // We use the actual scrollHeight of the editor to ensure synchronization
            const virtualContentHeight = scrollHeight * minScale;
            const containerHeight = minimap.clientHeight;

            const vpHeight = Math.max(clientHeight * minScale, 24);
            const vpTopAbsolute = scrollTop * minScale;

            if (virtualContentHeight <= containerHeight) {
                // Entire content fits in the minimap container
                contentEl.style.top = '0px';
                viewport.style.height = `${vpHeight}px`;
                viewport.style.top = `${vpTopAbsolute}px`;
            } else {
                // Content is longer than minimap, we need to scroll the minimap
                // We want the viewport to be visible and ideally centered
                const scrollRatio = scrollTop / Math.max(scrollHeight - clientHeight, 1);
                const extraHeight = virtualContentHeight - containerHeight;
                const contentShift = scrollRatio * extraHeight;

                contentEl.style.top = `-${contentShift}px`;
                viewport.style.height = `${vpHeight}px`;
                viewport.style.top = `${vpTopAbsolute - contentShift}px`;
            }
        };

        const scheduleUpdate = () => {
            if (animFrame !== null) cancelAnimationFrame(animFrame);
            animFrame = requestAnimationFrame(updateViewport);
        };

        // --- Drag the viewport strip to scroll the document ---
        const onViewportMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const scrollEl = getScrollEl();
            if (!scrollEl || !minimap) return;

            const startY = e.clientY;
            const startScrollTop = scrollEl.scrollTop;

            // The scale is fixed at 0.25 (as in CSS transform: scale(0.25))
            const minScale = 0.25;

            viewport.classList.add('dragging');

            const onMove = (mv: MouseEvent) => {
                const delta = mv.clientY - startY;
                // Move in editor is delta / minScale
                scrollEl.scrollTop = startScrollTop + (delta / minScale);
            };

            const onUp = () => {
                viewport.classList.remove('dragging');
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        };

        // --- Click on minimap background to jump there ---
        const onMinimapClick = (e: MouseEvent) => {
            // Ignore if the click was on the viewport handle itself
            if (viewport.contains(e.target as Node)) return;

            const scrollEl = getScrollEl();
            if (!scrollEl || !minimap) return;

            const rect = minimap.getBoundingClientRect();
            const clickY = e.clientY - rect.top;

            const minScale = 0.25;
            const virtualContentHeight = scrollEl.scrollHeight * minScale;
            const containerHeight = minimap.clientHeight;

            let contentShift = 0;
            if (virtualContentHeight > containerHeight) {
                const scrollRatio = scrollEl.scrollTop / Math.max(scrollEl.scrollHeight - scrollEl.clientHeight, 1);
                contentShift = scrollRatio * (virtualContentHeight - containerHeight);
            }

            // The actual position in the document relative to the top of the content
            const docY = (clickY + contentShift) / minScale;

            // Center the viewport on the click position
            scrollEl.scrollTop = docY - (scrollEl.clientHeight / 2);
        };

        // --- Scroll editor → update minimap viewport ---
        const onEditorScroll = () => scheduleUpdate();

        // Observe size/content changes
        const resizeObserver = new ResizeObserver(scheduleUpdate);
        resizeObserver.observe(minimap);

        const scrollEl = getScrollEl();
        if (scrollEl) {
            resizeObserver.observe(scrollEl);
            scrollEl.addEventListener('scroll', onEditorScroll, { passive: true });
        }

        // Observe DOM mutations in the minimap content (content changes)
        const mutationObserver = new MutationObserver(scheduleUpdate);
        const contentEl = minimap.querySelector('.guimd-minimap-content');
        if (contentEl) {
            mutationObserver.observe(contentEl, { childList: true, subtree: true, characterData: true });
        }

        minimap.addEventListener('click', onMinimapClick);
        viewport.addEventListener('mousedown', onViewportMouseDown as EventListener);

        // Initial render
        scheduleUpdate();

        return () => {
            if (animFrame !== null) cancelAnimationFrame(animFrame);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            minimap.removeEventListener('click', onMinimapClick);
            viewport.removeEventListener('mousedown', onViewportMouseDown as EventListener);
            scrollEl?.removeEventListener('scroll', onEditorScroll);
        };
    }, [getScrollEl, content]);

    return (
        <div className="guimd-minimap-container" ref={minimapRef}>
            <div
                className="guimd-minimap-content"
                style={{
                    fontFamily: config?.editor.fontFamily,
                    fontSize: `${config?.editor.fontSize}px`
                }}
                dangerouslySetInnerHTML={{ __html: content }}
            />
            {/* Viewport indicator — draggable and shows current scroll position */}
            <div className="guimd-minimap-viewport" ref={viewportRef}>

            </div>
        </div>
    );
};
