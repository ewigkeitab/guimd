import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../contexts/I18nContext';

interface LinkDialogProps {
    open: boolean;
    title: string;
    initialText: string;
    initialUrl: string;
    onConfirm: (text: string, url: string) => void;
    onCancel: () => void;
}

export const LinkDialog: React.FC<LinkDialogProps> = ({ open, title, initialText, initialUrl, onConfirm, onCancel }) => {
    const { t } = useI18n();
    const [text, setText] = useState(initialText);
    const [url, setUrl] = useState(initialUrl);
    const textRef = useRef<HTMLInputElement>(null);
    const urlRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setText(initialText);
            setUrl(initialUrl);
            setTimeout(() => {
                // Focus URL if text is already present, otherwise focus text
                if (initialText) {
                    urlRef.current?.focus();
                    urlRef.current?.select();
                } else {
                    textRef.current?.focus();
                }
            }, 50);
        }
    }, [open, initialText, initialUrl]);

    if (!open) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onConfirm(text, url);
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className="guimd-dialog-overlay" onClick={onCancel}>
            <div className="guimd-dialog guimd-input-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="guimd-dialog-header">
                    <span className="guimd-dialog-title">{title}</span>
                    <button className="guimd-dialog-close" onClick={onCancel} aria-label={t('common.close')}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="1" y1="1" x2="13" y2="13" />
                            <line x1="13" y1="1" x2="1" y2="13" />
                        </svg>
                    </button>
                </div>
                <div className="guimd-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="guimd-input-group">
                        <label className="guimd-input-label">{t('prompt.link_text')}</label>
                        <input
                            ref={textRef}
                            type="text"
                            className="guimd-input-field"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                handleKeyDown(e);
                            }}
                            onKeyUp={(e) => e.stopPropagation()}
                            onPaste={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="guimd-input-group">
                        <label className="guimd-input-label">{t('prompt.link_url')}</label>
                        <input
                            ref={urlRef}
                            type="text"
                            className="guimd-input-field"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                handleKeyDown(e);
                            }}
                            onKeyUp={(e) => e.stopPropagation()}
                            onPaste={(e) => e.stopPropagation()}
                            placeholder="https://..."
                        />
                    </div>
                </div>
                <div className="guimd-dialog-footer">
                    {initialUrl && (
                        <button
                            className="guimd-btn secondary"
                            style={{ color: '#e57373' }}
                            onClick={() => onConfirm(text, '')}
                        >
                            {t('prompt.remove_link')}
                        </button>
                    )}
                    <button className="guimd-btn secondary" onClick={onCancel}>{t('common.cancel')}</button>
                    <button className="guimd-btn" onClick={() => onConfirm(text, url)}>{t('common.ok')}</button>
                </div>
            </div>
        </div>
    );
};
