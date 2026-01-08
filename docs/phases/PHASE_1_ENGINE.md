# Phase 1: Core Game Engine

## Overview
This phase focused on building the deterministic core of the Secret Hitler game. The goal was to create a pure logic layer that operates without side effects, making it easy to test and reason about.

## Key Features Implemented

### 1. Finite State Machine (FSM)
-   Defined clear game phases: `LOBBY`, `ROLE_REVEAL`, `NOMINATION`, `VOTING`, `LEGISLATION`, `EXECUTIVE_ACTION`, `GAME_OVER`.
-   Implemented transitions in `fsm.ts` to strictly control valid moves.

### 2. State Management (Redux-style)
-   **Reducer:** `reducer.ts` implements the main game loop: `(state, action) -> { newState, events }`.
-   **Immutability:** All state updates create new objects, preserving history and ensuring determinism.

### 3. Game Logic
-   **Initialization:** `initializer.ts` handles shuffling decks, assigning roles, and setting up the board.
-   **Validation:** `validator.ts` ensures actions are legal (e.g., only the President can nominate a Chancellor).
-   **Sub-logic:**
    -   `logic/nomination.ts`: Handles chancellor nomination.
    -   `logic/voting.ts`: Manages voting processes and election tracker.
    -   `logic/legislation.ts`: Drawing, discarding, and enacting policies.
    -   `logic/winCondition.ts`: Checks for Liberal/Fascist wins or Hitler assassination.

## Files Created
-   `src/engine/index.ts`: Public API.
-   `src/engine/types.ts`: Type definitions.
-   `src/engine/reducer.ts`: Core logic.
-   `src/engine/fsm.ts`: State machine.
-   `src/engine/validator.ts`: Action validation.
-   `src/engine/initializer.ts`: Setup logic.
-   `src/engine/logic/*.ts`: Specific game mechanics.
-   `src/engine/utils/shuffle.ts`: Fisher-Yates shuffle.

## Core Workflows
1.  **Game Start:** `START_GAME` action triggers initialization -> Roles assigned -> Phase set to `ROLE_REVEAL`.
2.  **Round Cycle:** Nomination -> Voting -> (Election Tracker or Legislation) -> Executive Action (if applicable) -> Next Round.
