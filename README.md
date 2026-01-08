# Secret Hitler Game Engine

A pure, event-driven, server-side game engine for Secret Hitler.

## Philosophy

This engine is designed to be the "brain" of a Secret Hitler game server. It follows these core principles:

1.  **Pure Function**: `(state, action) -> { state, events }`. No side effects, no database calls, no network I/O.
2.  **Deterministic**: Given the same initial state and input actions, the output is always identical.
3.  **UI-Agnostic**: Emits rich events (`PHASE_CHANGED`, `VOTE_CAST`, `PLAYER_EXECUTED`) that a UI can interpret to show animations.
4.  **Secure**: Includes utilities to sanitize state for players (hiding roles, deck, hand) before sending over the wire.

## Architecture

The engine uses a Reducer pattern combined with a Finite State Machine (FSM).

- **FSM**: Enforces strict phase transitions (Lobby -> Role Reveal -> Nomination -> Voting -> etc.).
- **Validator**: Checks every action against the current phase, player role, and game rules before execution.
- **Logic Modules**: Code is split by domain (`nomination.ts`, `voting.ts`, `legislation.ts`, `executiveAction.ts`).

## Usage

### 1. Initialize

```typescript
import { gameReducer, createLobbyState } from './engine';

// Start with an empty lobby
let currentState = createLobbyState();
```

### 2. Process Actions

```typescript
const action = {
  type: 'START_GAME',
  playerIds: [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
    { id: 'p3', name: 'Charlie' },
    { id: 'p4', name: 'Dave' },
    { id: 'p5', name: 'Eve' }
  ]
};

const result = gameReducer(currentState, action);

if (result.events.find(e => e.type === 'ERROR')) {
  console.error("Action failed:", result.events[0].message);
} else {
  currentState = result.state;
  // Broadcast events to clients
  broadcast(result.events);
}
```

### 3. Send Updates to Clients

**CRITICAL**: Never send the raw `currentState` to all clients! It contains hidden roles and the deck.

```typescript
import { sanitizeStateForPlayer } from './engine';

// For Alice
const aliceView = sanitizeStateForPlayer(currentState, 'p1');
sendToPlayer('p1', aliceView);
```

## Supported Features

- [x] 5-10 Player Support
- [x] Role Assignment & Shuffle
- [x] Nomination & Voting
- [x] Election Tracker & Chaos
- [x] Legislative Session (Draw 3 -> Discard 1 -> Enact 1)
- [x] Executive Actions (MVP)
    - [x] Investigate Loyalty
    - [x] Execution
    - [ ] Special Election (Scaffolded)
    - [ ] Policy Peek (Scaffolded)
- [x] Win Conditions
    - [x] 5 Liberal Policies
    - [x] 6 Fascist Policies
    - [x] Hitler Elected Chancellor (after 3 fascist policies)
    - [x] Hitler Killed

## Multi-Room Scaling

Since the engine is just a pure function, you can run thousands of concurrent games.
Just store the `GameState` for each room in Redis or memory, map actions to the correct room, and call `gameReducer` for that room's state.

## Testing

The engine is built for easy testing. You can use `shuffleSeeded` if you need deterministic shuffling for regression tests.

```typescript
// Example test flow
const state0 = createLobbyState();
const { state: state1 } = gameReducer(state0, { type: 'START_GAME', ... });
const { state: state2 } = gameReducer(state1, { type: 'ADVANCE_PHASE' });
// Assert state2.phase === 'NOMINATION'
```