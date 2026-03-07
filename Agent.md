# Guimd AI Agent Configuration

## Rules and Guidelines for the AI Agent

The following rules apply to all interactions, code generation, and documentation created by the AI agent for the "Guimd" project:

1. Coding Standards:
   1.1. Comments within source code must be kept to an absolute minimum or be as short as possible.
   1.2. The code should be self-documenting through clear variable and function naming.

2. Language Requirements:
   2.1. All AI agent-specific documentation, thought processes, and communication must be conducted in the English language.
   2.2. All project documentation (SRS, SDS, Technical Documentation) must be written in the German language.

3. Tone and Style:
   3.1. The language used in all communications and documents must be formally structured.
   3.2. Do not use any emojis under any circumstances.

4. Task Management:
   4.1. Work Breakdown Structure (WBS) must be utilized for all planning.
   4.2. Every task must be broken down into the smallest possible actionable items.

## Project Context
Guimd is a cross-platform Markdown WYSIWYG editor built using the Wails framework. The backend is implemented in Go, and the frontend is implemented in React. Key features include a highly flexible user interface and multi-language support driven by external configuration files.

## UI Design System

### 1. Design Philosophy
Guimd follows a **Minimalist & Functional** design philosophy. The interface is designed to be clean, unobtrusive, and highly efficient for writing and editing Markdown. The design prioritizes content clarity and user productivity over heavy styling or visual flair.

### 2. Color Palette
The color scheme is built around a neutral, professional base with high-contrast text for readability. All colors are defined in `frontend/src/index.css`.

*   **Primary Background**: `#1e1e1e` (Dark Gray) - Used for the main editor background.
*   **Secondary Background**: `#2d2d2d` (Slightly Lighter Gray) - Used for sidebars, dialogs, and panels.
*   **Text (Primary)**: `#d4d4d4` (Light Gray) - Main text color.
*   **Text (Secondary)**: `#808080` (Medium Gray) - Used for placeholders, inactive elements, and metadata.
*   **Accent Color**: `#0078d4` (Vivid Blue) - Used for interactive elements like buttons, links, and active states.
*   **Borders**: `#333333` (Dark Gray) - Subtle borders to define sections without being distracting.

### 3. Typography
*   **Font Family**: `Inter`, `Segoe UI`, `Roboto`, `Arial`, `sans-serif`.
*   **Font Sizes**: Hierarchical sizing for clear visual structure.
    *   Headings: `1.4rem` - `2rem`
    *   Body Text: `1rem` - `1.1rem`
    *   UI Elements: `0.85rem` - `0.95rem`
*   **Font Weights**: Used sparingly for emphasis.
    *   Regular: `400`
    *   Medium: `500`
    *   Bold: `700` (Headings, Important Text)

### 4. Layout & Spacing
*   **Grid System**: A flexible grid allows for resizable panels (Sidebar, Editor, Preview).
*   **Spacing**: Generous padding (`1rem` - `1.5rem`) around content and between elements to reduce clutter.
*   **Alignment**: Left-aligned text for optimal readability. Centered alignment used for dialog boxes and titles.

### 5. Component Styling
*   **Buttons**: Rounded corners (`8px`), solid background on hover, subtle shadow.
*   **Dialogs**: Centered overlay with `backdrop-filter` for a frosted glass effect (where supported), rounded corners, and shadow.
*   **Inputs**: Clean, rectangular inputs with rounded corners and a distinct accent border when focused.
*   **Icons**: Simple, line-based icons that are easily recognizable.

### 6. Dark Mode
The entire application uses a **E-Paper** color scheme by default. This is achieved through CSS variables defined in `index.css`, allowing for easy future expansion to include a Light Mode.

