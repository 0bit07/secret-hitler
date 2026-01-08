# Secret Hitler - Architecture & Implementation Plan

## Project Description
This project is a digital implementation of the social deduction board game *Secret Hitler*. It features a server-authoritative, event-driven architecture designed to be robust, scalable, and secure. The core game logic is decoupled from the networking layer, allowing for deterministic state updates and easy testing.

## high-level Architecture

The system is divided into three main layers:

1.  **Core Engine (`src/engine`)**: A pure, deterministic FSM (Finite State Machine) that handles game rules and state transitions.
2.  **Server (`src/server`)**: A Node.js/Socket.io server that manages rooms, player connections, and persistence, acting as the bridge between clients and the engine.
3.  **Client (`client`)**: A lightweight frontend (currently a verification client) to interact with the game.

### 1. Core Engine
**Path:** `src/engine`
**Philosophy:** Redux-style, pure functions, no side effects.

-   **State Management:** `reducer.ts` takes `(state, action)` and returns `{ state, events }`.
-   **Types:** `types.ts` defines strong types for `GameState`, `Player`, `Role`, `Phase`, and `Action`.
-   **Logic:**
    -   `logic/` folder contains sub-game logic (voting, nomination, etc.).
    -   `validator.ts` checks if an action is valid for the current state.
    -   `fsm.ts` defines valid transitions and phase flows.
    -   `initializer.ts` sets up the initial game state.

### 2. Server
**Path:** `src/server`
**Philosophy:** Handle side effects, networking, and persistence.

-   **Entry Point:** `index.ts`.
-   **Networking:** `socketServer.ts` processes Socket.io events.
-   **Room Management:** `roomManager.ts` handles creating/joining rooms and mapping sockets to players.
-   **Storage:** `redisStore.ts` (and `mockRedisStore.ts`) persists game state.
-   **Event Handling:** `eventEmitter.ts` and `actionHandler.ts` route user actions to the engine and broadcast resulting state updates.

### 3. Client
**Path:** `client`
**Philosophy:** Simple interaction layer.

-   **Verification Client:** `src/main.ts` provides a basic UI to test connection, joining, and game actions.
-   **Scripts:** `scripts/verify.ts` includes automated verification scenarios.

## Workflows

### Game Loop Workflow
1.  **Action:** Client emits an action (e.g., `NOMINATE_CHANCELLOR`).
2.  **Server Receive:** `socketServer` receives event, passes to `roomManager`.
3.  **Validation:** `roomManager` validates room/player existence.
4.  **Engine Update:** `actionHandler` calls `engine.process(state, action)`.
5.  **State Change:** Engine returns new state and events.
6.  **Persistence:** Server saves new state to Redis.
7.  **Broadcast:** Server sends `STATE_UPDATE` and other events to room members.

---

## Roadmap

### Current Focus
-   [x] Core Engine Logic (Basic Gameplay)
-   [x] Server Room Management
-   [x] Basic Socket Communication
-   [ ] Comprehensive Unit Tests for Engine
-   [ ] Complete Client UI Implementation

### Future Goals
-   Reconnection handling.
-   Spectator mode.
-   Chat functionality.
-   Production deployment setup.
