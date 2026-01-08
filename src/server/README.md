# Secret Hitler Orchestration Layer

This directory contains the WebSocket-based orchestration layer for the Secret Hitler engine.

## Architecture

The server is designed to be **stateless** and **authoritative**.
- **Engine**: The core logic is treated as a black box. The server inputs actions and outputs state/events.
- **Redis**: The single source of truth for GameState. `game:{roomId}` stores the serialized state.
- **WebSocket**: Handles client connections. Ephemeral socket-to-player mapping is kept in memory (RoomManager).

## Flow

1. **Connect**: Client connects to `ws://server:port?roomId=A&playerId=1`.
2. **Sync**: Server loads state from Redis. If exists, sanitizes and sends `STATE_SYNC`.
3. **Action**: Client sends `{ type: "ACTION", action: ... }`.
4. **Process**:
   - Load State.
   - Validate (Player in room, etc.).
   - `gameReducer(state, action)`.
   - Save New State.
   - Emit Events (Broadcast public, Direct private).
   - Broadcast New State (Sanitized).

## Isolation

- **One Room = One GameState**.
- Rooms are isolated by `roomId`. Events and State updates never leak across rooms.
- Privacy is enforced by `sanitizeStateForPlayer` before sending any state updates.

## Redis Schema

- Key: `game:{roomId}`
- Value: JSON Serialized `GameState`
- TTL: 2 hours (refreshed on updates)

## UI Consumption

Clients should listen for:
- `STATE_SYNC`: Full replacement of local state (sanitized).
- `EVENT`: Discrete events (`ROLE_ASSIGNED`, `VOTE_CAST`). Use these for animations and toasts.

## Reconnection

- Client reconnects with same `playerId`.
- Server identifies active game in Redis.
- Server sends immediate `STATE_SYNC`.
