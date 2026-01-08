# Phase 3: Client & Verification

## Overview
This phase focused on creating a lightweight client to interact with the server and verifying the game logic end-to-end. We implemented privacy protections to ensure clients only receive information they are allowed to see.

## Key Features Implemented

### 1. Verification Client
-   **`client/src/main.ts`**:
    -   A simple TypeScript/HTML client.
    -   Connects to the backend.
    -   Provides buttons for basic actions (`START_GAME`, `NOMINATE`, `VOTE`).
    -   Displays the raw game state for debugging.

### 2. Privacy Filtering
-   **Server-side Sanitization:**
    -   Before sending state to a client, the server strips sensitive data (e.g., other players' roles, cards in the deck).
    -   Ensures "Secret" Hitler remains secret.

### 3. Verification Scripts
-   **`scripts/verify.ts`**:
    -   Automated script to simulate a full game loop.
    -   Validates that the server responds correctly to a sequence of actions.

## Files Created
-   `client/index.html`: UI skeleton.
-   `client/src/main.ts`: Client logic.
-   `scripts/verify.ts`: End-to-end verification script.
-   `src/engine/utils/privacy.ts`: Logic for state redaction.

## Core Workflows
1.  **Privacy Check:**
    -   Server: `getStateForPlayer(fullState, playerId)` calls `privacy.ts`.
    -   Output: A `maskedState` with hidden roles/cards replaced or removed.
2.  **Verification:**
    -   Run `npm run verify` -> Script spawns simulated clients -> Plays through a scenario -> Asserts expected states.
