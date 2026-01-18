# Secret Hitler Asset Requirements

This document outlines the required image assets for the Secret Hitler client. You can use this guide to generate custom assets using AI models or create them manually.

## Directory Structure
All assets should be placed in `client/src/assets/`.

```
client/src/assets/
├── roles/
│   ├── role-liberal.svg  (or .png)
│   ├── role-fascist.svg  (or .png)
│   └── role-hitler.svg   (or .png)
├── cards/
│   ├── policy-liberal.svg (or .png)
│   ├── policy-fascist.svg (or .png)
│   └── policy-back.svg    (or .png)
└── ui/
    └── board-placeholder.svg
```

## Asset Specifications

### 1. Role Cards (`client/src/assets/roles/`)
These cards are displayed during the Role Reveal phase and when inspecting players.

| Filename | Purpose | Dimensions (rec.) | Visual Description |
| :--- | :--- | :--- | :--- |
| `role-liberal.svg` | Identifies a Liberal player. | **300x500px** (Portrait) | Should feature blue tones, Dove iconography, classical architecture, or "Peace" symbolism. Text: "LIBERAL". |
| `role-fascist.svg` | Identifies a Fascist player. | **300x500px** (Portrait) | Should feature red tones, darker/authoritative imagery, skulls, or snake symbolism. Text: "FASCIST". |
| `role-hitler.svg` | Identifies the Secret Hitler. | **300x500px** (Portrait) | Should be distinct from standard Fascist, ominous red/black themes, unique Eagle/Snake iconography. Text: "HITLER". |

### 2. Policy Cards (`client/src/assets/cards/`)
These cards are drawn by the President and enacted by the Chancellor.

| Filename | Purpose | Dimensions (rec.) | Visual Description |
| :--- | :--- | :--- | :--- |
| `policy-liberal.svg` | A Liberal Policy. | **300x500px** (Portrait) | Blue theme, official decree style, Dove seal. Text: "LIBERAL POLICY". |
| `policy-fascist.svg` | A Fascist Policy. | **300x500px** (Portrait) | Red theme, martial decree style, Skull/Snake seal. Text: "FASCIST POLICY". |
| `role-back.png` | **NEW**: The back of **Role Cards**. Retro Casino theme. | **300x500px** (Portrait) | High contrast, distinct from policy deck. |
| `policy-back.png` | The back of **Policy Cards**. | **300x500px** (Portrait) | Retro Casino themed design. |

### 4. Player Avatars (`client/src/assets/avatars/`) **[NEW]**
Players select a unique avatar when joining the lobby.

| Filename | Purpose | Dimensions (rec.) | Visual Description |
| :--- | :--- | :--- | :--- |
| `avatar-01.png` to `avatar-12.png` | 12 Unique Player Avatars. | **512x512px** (Square) | Distinct characters or icons (e.g., animals, retro casino patrons, spies). Transparent background recommended. |

### 5. Game Board (`client/src/assets/ui/`)
The main play area.

| Filename | Purpose | Dimensions (rec.) | Visual Description |
| :--- | :--- | :--- | :--- |
| `board-placeholder.svg` | Background for the game board. | **1920x1080px** (Landscape) | A wooden table texture, or a government office desk. Should provide good contrast for cards placed on top. |

## File Formats
*   **SVG (Recommended)**: Best for crisp scaling on all devices.
*   **PNG/JPG**: Supported if high resolution (at least 2x dimensions listed above).
*   **Note**: If switching to PNG, you must update the import statements in the React components (e.g., `import libRole from '../../assets/roles/role-liberal.png'`).
