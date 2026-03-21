import React from 'react';
import { useI18n } from '../contexts/I18nContext';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, title, message, onConfirm, onCancel }) => {
    const { t } = useI18n();

    if (!open) return null;

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
                </div>
                <div className="guimd-dialog-footer">
                    <button className="guimd-btn secondary" onClick={onCancel}>{t('common.cancel')}</button>
                    <button className="guimd-btn" onClick={onConfirm}>{t('common.ok')}</button>
                </div>
            </div>
        </div>
    );
};
