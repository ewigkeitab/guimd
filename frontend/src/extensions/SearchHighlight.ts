import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const SearchHighlightKey = new PluginKey('searchHighlight');

export const SearchHighlight = Extension.create({
    name: 'searchHighlight',

    addStorage() {
        return {
            searchTerm: '',
            matchCase: false,
            currentResultIndex: -1,
        };
    },

    addCommands() {
        return {
            setSearchInfo: (searchTerm: string, matchCase: boolean, currentResultIndex: number) => ({ tr, dispatch }) => {
                this.storage.searchTerm = searchTerm;
                this.storage.matchCase = matchCase;
                this.storage.currentResultIndex = currentResultIndex;
                
                if (dispatch) {
                    tr.setMeta('searchHighlightUpdate', true);
                }
                return true;
            },
            clearSearchInfo: () => ({ tr, dispatch }) => {
                this.storage.searchTerm = '';
                this.storage.matchCase = false;
                this.storage.currentResultIndex = -1;
                
                if (dispatch) {
                    tr.setMeta('searchHighlightUpdate', true);
                }
                return true;
            }
        };
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: SearchHighlightKey,
                state: {
                    init: () => DecorationSet.empty,
                    apply: (tr, oldState) => {
                        // Recompute on doc change or explicit command
                        if (!tr.docChanged && !tr.getMeta('searchHighlightUpdate')) {
                            return oldState.map(tr.mapping, tr.doc);
                        }

                        const { searchTerm, matchCase, currentResultIndex } = this.storage;

                        if (!searchTerm) return DecorationSet.empty;

                        const decorations: Decoration[] = [];
                        let regexFlags = 'g';
                        if (!matchCase) regexFlags += 'i';
                        const escapedQuery = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        
                        let matchIndex = 0;

                        tr.doc.descendants((node, pos) => {
                            if (node.isText && node.text) {
                                let match;
                                const localRegex = new RegExp(escapedQuery, regexFlags);
                                while ((match = localRegex.exec(node.text)) !== null) {
                                    const from = pos + match.index;
                                    const to = pos + match.index + match[0].length;
                                    
                                    const isActive = (matchIndex === currentResultIndex);
                                    
                                    decorations.push(
                                        Decoration.inline(from, to, {
                                            class: isActive ? 'guimd-search-match active' : 'guimd-search-match',
                                        })
                                    );
                                    
                                    matchIndex++;
                                }
                            }
                        });

                        return DecorationSet.create(tr.doc, decorations);
                    },
                },
                props: {
                    decorations(state) {
                        return this.getState(state);
                    },
                },
            }),
        ];
    },
});

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        searchHighlight: {
            setSearchInfo: (searchTerm: string, matchCase: boolean, currentResultIndex: number) => ReturnType;
            clearSearchInfo: () => ReturnType;
        }
    }
}
