import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../contexts/I18nContext';

interface InputDialogProps {
    open: boolean;
    title: string;
    message: string;
    initialValue: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

export const InputDialog: React.FC<InputDialogProps> = ({ open, title, message, initialValue, onConfirm, onCancel }) => {
    const { t } = useI18n();
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setValue(initialValue);
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
        }
    }, [open, initialValue]);

    if (!open) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onConfirm(value);
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
                <div className="guimd-dialog-body">
                    <p className="guimd-input-title">{message}</p>
                    <input
                        ref={inputRef}
                        type="text"
                        className="guimd-input-field"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            handleKeyDown(e);
                        }}
                        onKeyUp={(e) => e.stopPropagation()}
                        onPaste={(e) => e.stopPropagation()}
                        placeholder="..."
                    />
                </div>
                <div className="guimd-dialog-footer">
                    <button className="guimd-btn secondary" onClick={onCancel}>{t('common.cancel')}</button>
                    <button className="guimd-btn" onClick={() => onConfirm(value)}>{t('common.ok')}</button>
                </div>
            </div>
        </div>
    );
};
