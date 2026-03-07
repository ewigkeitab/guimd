import React, { useState, useRef, useEffect } from 'react';

export interface MenuItemDef {
    label?: string;
    action?: () => void;
    separator?: boolean;
    disabled?: boolean;
    title?: string;      // native tooltip (e.g. full path for recent files)
    items?: MenuItemDef[];
}

interface MenuDef {
    label: string;
    items: MenuItemDef[];
}

interface MenuBarProps {
    menus: MenuDef[];
}

const MenuItem: React.FC<{ item: MenuItemDef, onAction: () => void }> = ({ item, onAction }) => {
    const [isSubOpen, setIsSubOpen] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    if (item.separator) {
        return <div className="guimd-menu-separator" />;
    }

    const handleMouseEnter = () => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        setIsSubOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = window.setTimeout(() => setIsSubOpen(false), 200);
    };

    if (item.items) {
        return (
            <div
                className="guimd-menu-item-parent"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button className="guimd-menu-item" disabled={item.disabled}>
                    <span>{item.label}</span>
                    <span className="guimd-menu-submenu-arrow">▶</span>
                </button>
                {isSubOpen && (
                    <div className="guimd-submenu">
                        {item.items.map((sub, idx) => (
                            <MenuItem key={idx} item={sub} onAction={onAction} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <button
            className="guimd-menu-item"
            disabled={item.disabled}
            title={item.title}
            onClick={() => {
                onAction();
                item.action?.();
            }}
        >
            {(() => {
                const parts = (item.label ?? '').split('\t');
                return <>
                    <span>{parts[0]}</span>
                    {parts[1] && <span className="guimd-menu-item-shortcut">{parts[1]}</span>}
                </>;
            })()}
        </button>
    );
};

export const MenuBar: React.FC<MenuBarProps> = ({ menus }) => {
    const [openMenu, setOpenMenu] = useState<number | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggle = (idx: number) => setOpenMenu(openMenu === idx ? null : idx);

    return (
        <div 
            className="guimd-menubar" 
            ref={ref}
            onContextMenu={(e) => e.preventDefault()}
        >
            {menus.map((menu, idx) => (
                <div key={idx} className="guimd-menu-root">
                    <button
                        className={`guimd-menu-trigger${openMenu === idx ? ' active' : ''}`}
                        onClick={() => toggle(idx)}
                    >
                        {menu.label}
                    </button>
                    {openMenu === idx && (
                        <div className="guimd-dropdown">
                            {menu.items.map((item, iIdx) => (
                                <MenuItem key={iIdx} item={item} onAction={() => setOpenMenu(null)} />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
