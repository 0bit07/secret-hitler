# Phase 2: Server Infrastructure

## Overview
This phase built the networking and persistence layer around the core engine. We used Node.js, Socket.io, and Redis to manage real-time multiplayer sessions.

## Key Features Implemented

### 1. Room Management
-   **`roomManager.ts`**:
    -   Handles room creation (unique join codes).
    -   Manages player joining/leaving.
    -   Maps Socket IDs to Player IDs.
    -   ensures concurrency safety (basic locking/checks).

### 2. Socket.io Integration
-   **`socketServer.ts`**:
    -   Listens for client connections.
    -   Routes events (`join_room`, `game_action`) to the appropriate handlers.
    -   Handles disconnects.

### 3. Persistence
-   **`redisStore.ts`**:
    -   Saves game state to Redis for crash recovery.
    -   Implemented a `MockRedisStore` for development/testing without a live Redis instance.

### 4. Event Handling
-   **`actionHandler.ts`**:
    -   The bridge between Server and Engine.
    -   Receives action -> Validates -> Calls Engine -> Saves State -> Broadcasts updates.
-   **`eventEmitter.ts`**:
    -   Standardized way to send events to clients (`emitToRoom`, `emitToPlayer`).

## Files Created
-   `src/server/index.ts`: Server entry point.
-   `src/server/socketServer.ts`: Websocket handling.
-   `src/server/roomManager.ts`: Room logic.
-   `src/server/redisStore.ts`: Persistence.
-   `src/server/actionHandler.ts`: Logic glue.
-   `src/server/eventEmitter.ts`: Output handling.

## Core Workflows
1.  **Join Room:** Client emits `join_room` -> Server validates -> Adds player to `Room` object -> Broadcasts `PLAYER_JOINED`.
2.  **Action Handling:** User Action -> `actionHandler` -> `engine.process` -> `store.save` -> `io.to(room).emit('state_update')`.
