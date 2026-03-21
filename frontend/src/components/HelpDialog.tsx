import React from 'react';
import { useI18n } from '../contexts/I18nContext';

interface HelpDialogProps {
    open: boolean;
    onClose: () => void;
}

const markdownBasics = [
    { syntax: '# Header', descKey: 'help.h1' },
    { syntax: '## Header', descKey: 'help.h2' },
    { syntax: '**Bold**', descKey: 'help.bold' },
    { syntax: '*Italic*', descKey: 'help.italic' },
    { syntax: '[Link](url)', descKey: 'help.link' },
    { syntax: '![Alt](url)', descKey: 'help.image' },
    { syntax: '- Item', descKey: 'help.ul' },
    { syntax: '1. Item', descKey: 'help.ol' },
    { syntax: '`code`', descKey: 'help.code' },
    { syntax: '```', descKey: 'help.codeblock' },
    { syntax: '> Quote', descKey: 'help.quote' },
    { syntax: '---', descKey: 'help.hr' },
];

const features = [
    'help.feature.themes',
    'help.feature.wysiwyg',
    'help.feature.lightweight',
    'help.feature.crossplatform',
];

export const HelpDialog: React.FC<HelpDialogProps> = ({ open, onClose }) => {
    const { t } = useI18n();
    if (!open) return null;

    return (
        <div className="guimd-dialog-overlay" onClick={onClose}>
            <div className="guimd-dialog guimd-help-dialog" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="guimd-dialog-header">
                    <span className="guimd-dialog-title">{t('help.title')}</span>
                    <button className="guimd-dialog-close" onClick={onClose} aria-label={t('common.close')}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="1" y1="1" x2="13" y2="13" />
                            <line x1="13" y1="1" x2="1" y2="13" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="guimd-dialog-body">
                    <div className="guimd-help-section">
                        <div className="guimd-about-section-title">{t('help.writing')}</div>
                        <p className="guimd-help-text">{t('help.writing_desc')}</p>

                        <div className="guimd-help-grid">
                            {markdownBasics.map((item) => (
                                <div key={item.syntax} className="guimd-help-grid-item">
                                    <code className="guimd-code-snippet">{item.syntax}</code>
                                    <span className="guimd-help-grid-desc">{t(item.descKey)}</span>
                                </div>
                            ))}
                        </div>
                    </div>




                    <div className="guimd-help-section">
                        <div className="guimd-about-section-title">{t('help.shortcuts')}</div>
                        <div className="guimd-about-shortcuts">
                            {[
                                [t('menu.new'), '⌃N'],
                                [t('menu.open'), '⌃O'],
                                [t('menu.save'), '⌃S'],
                                [t('menu.saveAs'), '⌃⇧S'],
                                [t('toolbar.bold'), '⌃B'],
                                [t('toolbar.italic'), '⌃I'],
                            ].map(([action, shortcut]) => (
                                <div key={action} className="guimd-about-shortcut-row">
                                    <span>{action}</span>
                                    <kbd className="guimd-kbd">{shortcut}</kbd>
                                </div>
                            ))}
                        </div>
                    </div>



                    <div className="guimd-help-section">
                        <div className="guimd-about-section-title">{t('help.features')}</div>
                        <ul className="guimd-about-features">
                            {features.map((f) => (
                                <li key={f}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="2 6 5 9 10 3" />
                                    </svg>
                                    {t(f)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="guimd-dialog-footer">
                    <button className="guimd-btn" onClick={onClose}>{t('common.close')}</button>
                </div>
            </div>
        </div>
    );
};
