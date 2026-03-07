# Technische Dokumentation - Guimd

## 1. Systemvoraussetzungen und Abhängigkeiten
Um das Projekt kompilieren und ausführen zu können, müssen folgende Abhängigkeiten vorliegen:
*   Go (Version >= 1.21)
*   Node.js (Version >= 18)
*   NPM
*   Wails CLI

## 2. Projektstruktur
Eine empfohlene Struktur für das Wails-Projekt:
*   `/main.go` - Einstiegspunkt der Anwendung, Wails-Initialisierung.
*   `/app.go` - Go-Bindings für das Frontend.
*   `/build/` - Wails-Konfigurations- und Build-Ressourcen.
*   `/config/` - Pfad für externe Einstellungs- und Sprachdateien.
*   `/external/` - Speichert i18n JSON/YAML Dateien.
*   `/frontend/` - React-Anwendung.
    *   `/frontend/src/App.tsx` - Hauptkomponente.
    *   `/frontend/src/components/` - Wiederverwendbare UI-Elemente und Editor.
    *   `/frontend/src/wailsjs/` - Generierte Bindings durch Wails.

## 3. Implementierungsrichtlinien (Frontend)
*   Verwendung von React Hooks zur Zustandsverwaltung.
*   Einbindung von Tiptap (basierend auf Prosemirror) für die Editor-Kernfunktionalität.
*   Zuletzt geöffnete Dateien (Recent Files) werden im `localStorage` persistiert.
*   Dirty-State-Tracking zeigt einen "Modified"-Status an, wenn Änderungen ungespeichert sind.
*   Alle UI-Ebenen müssen das I18n-Modul für Strings konsumieren.

## 4. Implementierungsrichtlinien (Backend)
*   Trennung der IO-Schnittstellen und Wails-Methoden zur besseren Testabdeckung.
*   Einsatz robuster Fehlerbehandlung bei Lese-/Schreibvorgängen.
*   Automatische Auflösung relativer Bildpfade zu `/wails-local-file/` URIs beim Öffnen und Rückführung zu relativen Pfaden beim Speichern (Portabilität).
*   Der Konfigurationsmanager muss bei fehlenden externen Konfigurationsdateien Fallback-Standardsätze zur Verfügung stellen.

## 5. Fehlerbehebung (Troubleshooting)

### 5.1 Linux Build-Fehler: webkit2gtk-4.0 nicht gefunden
In neueren Linux-Distributionen (wie Ubuntu 24.10, 25.04 oder neuer) wurde Version 4.0 durch Version 4.1 ersetzt.

**Lösung für Debian/Ubuntu (aktuelle Versionen):**
```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev
mkdir -p .pkgconfig && ln -sf /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.1.pc .pkgconfig/webkit2gtk-4.0.pc
```
Zusätzlich muss die Anwendung mit dem Go-Build-Tag `webkit2gtk_4.1` kompiliert werden:
```bash
wails build -tags webkit2gtk_4.1
```
(Im bereitgestellten `Makefile` wird dies automatisch über einen lokalen `.pkgconfig`-Link und Exporte gehandhabt).

**Alternative für ältere Versionen:**
```bash
sudo apt-get install -y libwebkit2gtk-4.0-dev
```

**Lösung für Fedora:**
```bash
sudo dnf install webkit2gtk3-devel
```

### 5.2 Systemdiagnose
Um alle fehlenden Abhängigkeiten automatisch zu identifizieren, sollte das Wails-Diagnosetool verwendet werden:

```bash
wails doctor
```

Dies listet alle fehlenden Pakete auf und gibt spezifische Installationsbefehle für die verwendete Distribution aus.

Dies stellt sicher, dass das Wails-Backend die notwendigen GTK- und WebKit-Headern für das Rendering des Anwendungsfensters findet.

## 6. Build und Deployment

### 6.1 Optimierung der Binärgröße
Für Produktionsbuilds werden folgende Flags im `Makefile` verwendet:
*   `-ldflags="-s -w"`: Entfernt Debug-Symbole und DWARF-Tabellen.
*   `-upx`: Komprimiert die ausführbare Datei (erfordert installiertes `upx`).

### 6.2 Icon-Konfiguration
Icons werden in der `wails.json` zentral konfiguriert:
*   Windows: `./build/windows/icon.ico`
*   macOS: `./build/appicon.png` (wird automatisch in `.icns` umgewandelt)
