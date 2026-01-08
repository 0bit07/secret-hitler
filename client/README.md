# Secret Hitler Verification Client

A minimal, no-frills web client to verify the Secret Hitler WebSocket backend.
Designed for correctness testing, NOT for end-user gameplay.

## How to Run

1. **Start Backend** (in root directory):
   ```bash
   USE_MOCK_REDIS=true npx ts-node src/server/index.ts
   ```

2. **Start Client** (in `client/` directory):
   ```bash
   npm run dev
   ```
   Open the URL shown (usually `http://localhost:5173`).

## Verification Guide

### 1. Multiplayer Connection
- Open 2 browser tabs side-by-side.
- Tab 1: Room `R1`, Player `P1` -> Connect.
- Tab 2: Room `R1`, Player `P2` -> Connect.
- **Verify**: Both say "Connected" and logs show the connection info.

### 2. Game Start
- Have 5+ players (Tabs P1..P5) connect to the same room.
- Click `START_GAME` on P1.
- **Verify**:
  - All tabs receive `EVENT GAME_STARTED` (Log).
  - All tabs receive `STATE_SYNC` with `phase: ROLE_REVEAL`.
  - P1's role is visible in their State JSON dump.
  - P2 cannot see P1's role (check `players` array in P2's state dump).

### 3. Reconnection
- Close P1's tab.
- Re-open P1's tab.
- Connect as `P1` to `R1`.
- **Verify**:
  - `STATE_SYNC` arrives immediately.
  - Game state matches what it was before disconnect.

## Features
- **Event Log**: Shows all server events with timestamps.
- **State Dump**: Raw JSON view of what the server thinks this player should see.
- **Manual JSON**: Send any arbitrary action payload for edge-case testing.
