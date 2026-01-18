# Phase A – Functional UI (Secret Hitler Client)

## Goal
Replace the current verification UI with a clean, functional, player-facing UI while preserving the existing architecture.
- **Backend remains authoritative.**
- **Client remains stateless.**
- **Clarity > Usability > Structure.** (Animations come in Phase B).

## 1. Client Architecture Constraints (Strict)
The UI must remain strictly reactive.
- **Render only based on**: `STATE_SYNC` and `EVENT` messages.
- **Store only**: `currentState`, `lastEvents`, `playerId`, `roomId`.
- **NEVER**:
    - Contain game logic.
    - Infer hidden information.
    - Calculate legality of actions.
- **Components**: Must act as "Dumb renderers + action emitters". All decisions come from the server.

### State Flow
`WS Message` -> `App Component` -> `State Update` -> `Screen Re-render` -> `User Action` -> `WS Send`

## 2. Component Structure
```text
client/src/
├── App.tsx             # Main entry, WS connection, Routing
├── assets/             # Images (PNG/SVG) - STRICTLY ENFORCED
│   ├── cards/
│   ├── roles/
│   └── ui/
├── ui/
│   ├── layout/         # Wrappers
│   │   └── GameLayout.tsx
│   ├── screens/        # Phase-specific Views
│   │   ├── LobbyScreen.tsx
│   │   ├── RoleRevealScreen.tsx
│   │   ├── NominationScreen.tsx
│   │   ├── VotingScreen.tsx
│   │   ├── LegislativeScreen.tsx
│   │   ├── ExecutiveScreen.tsx
│   │   └── GameOverScreen.tsx
│   └── components/     # Reusable logic-less UI
│       ├── PlayerList.tsx
│       ├── PlayerCard.tsx
│       ├── ActionButton.tsx
│       ├── Card.tsx
│       └── PhaseHeader.tsx
```

## 3. Asset System & Requirements
All visual elements representing cards, roles, or the board must be **image assets**, not CSS-drawn. Even placeholders must be actual PNG/SVG files.

| Asset Type | File Path | Dimensions (px) |
| :--- | :--- | :--- |
| **Policy Card** | `assets/cards/policy-liberal.png` | 400 x 600 |
| | `assets/cards/policy-fascist.png` | 400 x 600 |
| | `assets/cards/policy-back.png` | 400 x 600 |
| **Role Card** | `assets/roles/role-liberal.png` | 400 x 600 |
| | `assets/roles/role-fascist.png` | 400 x 600 |
| | `assets/roles/role-hitler.png` | 400 x 600 |
| **UI** | `assets/ui/board-placeholder.png` | 1200 x 800 |

**Layout Note**: The UI layout must respect these dimensions to allow for safe asset replacement in the future.

## 4. Screen Responsibilities

| Phase | Screen | Responsibility |
| :--- | :--- | :--- |
| `LOBBY` | `LobbyScreen` | Show list. Only owner sees START. |
| `ROLE_REVEAL` | `RoleRevealScreen` | Read-only role view. |
| `NOMINATION` | `NominationScreen` | Show players. Only President clicks to nominate. Others watch. |
| `VOTING` | `VotingScreen` | Everyone votes JA/NEIN. |
| `LEGISLATION` | `LegislativeScreen` | **President**: Discard 1 of 3.<br>**Chancellor**: Enact 1 of 2.<br>**Others**: Spectator view. |
| `EXECUTIVE_ACTION` | `ExecutiveScreen` | Only authorized player acts (e.g., Kill). Others watch. |
| `GAME_OVER` | `GameOverScreen` | Read-only winner display. |

## 5. Future Animation Layer (Phase B)
- **Phase A**: State transitions snap instantly.
- **Phase B Integration**: We will intercept `EVENT` messages (like `VOTE_CAST`) to trigger animations *before* updating the visual state. The `GameLayout` will likely become an `AnimatePresence` wrapper. No architecture refactor should be needed, just a layer addition.

## Definition of Done
Phase A is complete when:
- [ ] Entire game is playable via UI.
- [ ] No JSON debug panels or raw text buttons.
- [ ] All visuals (cards/roles) use `assets/` images.
- [ ] UI respects backend authority (no client-side rule validation).
- [ ] Mobile and Desktop layouts are functional.
