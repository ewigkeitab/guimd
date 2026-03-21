import React from 'react';
import logo from '../assets/logo.png';
import { useI18n } from '../contexts/I18nContext';

interface AboutDialogProps {
    open: boolean;
    onClose: () => void;
    version: string;
    onCopy?: (text: string) => void;
}

const author = {
    name: 'CCH',
    role: 'Author',
    github: 'https://github.com/ewigkeitab/guimd',
};

const techStack = [
    { label: 'Runtime', value: 'Wails v2' },
    { label: 'Backend', value: 'Go' },
    { label: 'Frontend', value: 'React + TypeScript' },
    { label: 'Editor', value: 'Tiptap' },
];

export const AboutDialog: React.FC<AboutDialogProps> = ({ open, onClose, version, onCopy }) => {
    const { t } = useI18n();
    if (!open) return null;

    return (
        <div className="guimd-dialog-overlay" onClick={onClose}>
            <div className="guimd-dialog guimd-about-dialog" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="guimd-dialog-header">
                    <span className="guimd-dialog-title">{t('about.title')}</span>
                    <button className="guimd-dialog-close" onClick={onClose} aria-label={t('common.close')}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="1" y1="1" x2="13" y2="13" />
                            <line x1="13" y1="1" x2="1" y2="13" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="guimd-dialog-body guimd-about-body">
                    {/* App branding */}
                    <div className="guimd-about-brand">
                        <div>
                            <div className="guimd-about-header">
                                <div className="guimd-about-name">Guimd</div>
                                <div className="guimd-about-version">v{version || '—'}</div>
                            </div>

                            <div className="guimd-about-tagline">{t('about.tagline')}</div>
                        </div>
                    </div>

                    {/* Author */}
                    <div className="guimd-about-author">

                        <div className="guimd-about-author-info">
                            <div className="guimd-about-author-role">{t('about.author')}</div>
                            <div className="guimd-about-author-name">{author.name}</div>

                        </div>
                        <a
                            className="guimd-about-author-link"
                            href={author.github}
                            target="_blank"
                            rel="noreferrer"
                            title="GitHub"
                            onClick={(e) => {
                                if (onCopy) {
                                    e.preventDefault();
                                    onCopy(author.github);
                                }
                            }}
                        >{author.github}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                            </svg>

                        </a>
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
