import React, { useState, useEffect, useRef } from 'react';
import { X, Search, ChevronUp, ChevronDown, Replace } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface FindReplaceDialogProps {
    open: boolean;
    onClose: () => void;
    onFindNext: (query: string, matchCase: boolean) => void;
    onFindPrev: (query: string, matchCase: boolean) => void;
    onReplace: (query: string, replacement: string, matchCase: boolean) => void;
    onReplaceAll: (query: string, replacement: string, matchCase: boolean) => void;
    matchCount: number;
    currentMatch: number; // 1-indexed
    initialQuery?: string;
}

export const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({
    open,
    onClose,
    onFindNext,
    onFindPrev,
    onReplace,
    onReplaceAll,
    matchCount,
    currentMatch,
    initialQuery = ''
}) => {
    const { t } = useI18n();
    const [findText, setFindText] = useState(initialQuery);
    const [replaceText, setReplaceText] = useState('');
    const [matchCase, setMatchCase] = useState(false);
    const [showReplace, setShowReplace] = useState(false);
    const findInputRef = useRef<HTMLInputElement>(null);

    // Sync initial query if it changes externally
    useEffect(() => {
        setFindText(initialQuery);
    }, [initialQuery]);

    useEffect(() => {
        if (open) {
            // Focus the input when opened
            setTimeout(() => {
                findInputRef.current?.focus();
                findInputRef.current?.select();
            }, 10);
        }
    }, [open]);

    // Perform search automatically as you type
    useEffect(() => {
        if (open) {
            onFindNext(findText, matchCase);
        }
    }, [findText, matchCase, open]); // Removed onFindNext to avoid rapid loops if not wrapped carefully

    if (!open) return null;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                onFindPrev(findText, matchCase);
            } else {
                onFindNext(findText, matchCase);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    return (
        <div className="guimd-find-replace-bar">
            <div className="guimd-fr-row">
                <button
                    className={`guimd-fr-toggle ${showReplace ? 'active' : ''}`}
                    onClick={() => setShowReplace(!showReplace)}
                    title={t('find.toggleReplace') || 'Toggle Replace'}
                >
                    <ChevronDown size={14} style={{ transform: showReplace ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                </button>

                <div className="guimd-fr-input-group">
                    <Search size={14} className="guimd-fr-icon" />
                    <input
                        ref={findInputRef}
                        type="text"
                        className="guimd-fr-input"
                        placeholder={t('find.placeholder') || 'Find...'}
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <span className="guimd-fr-count">
                        {findText ? `${currentMatch}/${matchCount}` : ''}
                    </span>
                    <button
                        className={`guimd-fr-option-btn ${matchCase ? 'active' : ''}`}
                        onClick={() => setMatchCase(!matchCase)}
                        title={t('find.matchCase') || 'Match Case'}
                    >
                        Aa
                    </button>
                </div>

                <div className="guimd-fr-actions">
                    <button className="guimd-fr-btn" onClick={() => onFindPrev(findText, matchCase)} title={t('find.prev') || 'Previous (Shift+Enter)'}>
                        <ChevronUp size={16} />
                    </button>
                    <button className="guimd-fr-btn" onClick={() => onFindNext(findText, matchCase)} title={t('find.next') || 'Next (Enter)'}>
                        <ChevronDown size={16} />
                    </button>
                    <button className="guimd-fr-btn close-btn" onClick={onClose} title={t('find.close') || 'Close (Esc)'}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            {showReplace && (
                <div className="guimd-fr-row replace-row">
                    <div className="guimd-fr-spacer"></div>
                    <div className="guimd-fr-input-group">
                        <Replace size={14} className="guimd-fr-icon" />
                        <input
                            type="text"
                            className="guimd-fr-input"
                            placeholder={t('replace.placeholder') || 'Replace...'}
                            value={replaceText}
                            onChange={(e) => setReplaceText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    onReplace(findText, replaceText, matchCase);
                                } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    onClose();
                                }
                            }}
                        />
                    </div>
                    <div className="guimd-fr-actions">
                        <button className="guimd-fr-text-btn" onClick={() => onReplace(findText, replaceText, matchCase)}>
                            {t('replace.action') || 'Replace'}
                        </button>
                        <button className="guimd-fr-text-btn" onClick={() => onReplaceAll(findText, replaceText, matchCase)}>
                            {t('replace.all') || 'All'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
