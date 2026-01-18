
import {
    RoomState,
    PlatformAction,
    PlatformEvent,
    PlatformPhase
} from './types';
import { gameReducer } from '../engine/reducer';
import { createLobbyState } from '../engine/initializer';
import { SecretHitlerGameState } from '../engine/types';

export function platformReducer(
    state: RoomState,
    action: PlatformAction
): { state: RoomState; events: PlatformEvent[] } {


    // Helper to sync state changes to events
    const withUpdate = (newState: RoomState, extraEvents: PlatformEvent[] = []) => {
        return {
            state: newState,
            events: [...extraEvents, { type: 'ROOM_UPDATED', state: newState } as PlatformEvent]
        };
    };

    switch (action.type) {
        case 'CREATE_ROOM':
            // Logic handled by caller (creation of initial state), but if we needed reset:
            return { state, events: [] };

        case 'JOIN_ROOM': {
            if (state.players.some(p => p.id === action.playerId)) {
                return { state, events: [] }; // Idempotent
            }
            // Check full
            if (state.players.length >= 10) {
                return { state, events: [{ type: 'ERROR', message: 'Room full' } as PlatformEvent] };
            }

            const newPlayer = {
                id: action.playerId,
                name: action.playerId, // Default name
                avatarId: action.avatarId || 'avatar-01',
                isReady: false,
                isHost: state.players.length === 0 // Should be handled by initial creation, but safeguard
            };

            const newState = {
                ...state,
                players: [...state.players, newPlayer]
            };
            return withUpdate(newState);
        }

        case 'LEAVE_ROOM': {
            const newPlayers = state.players.filter(p => p.id !== action.playerId);
            const wasHost = state.players.find(p => p.id === action.playerId)?.isHost;

            let newState = { ...state, players: newPlayers };

            if (wasHost && newPlayers.length > 0) {
                // Promote next player
                newPlayers[0].isHost = true;
                newState.ownerId = newPlayers[0].id;
            }

            return withUpdate(newState);
        }

        case 'SELECT_AVATAR': {
            // Find player
            const playerIndex = state.players.findIndex(p => p.id === action.playerId);
            if (playerIndex === -1) return { state, events: [] };

            // Update avatar
            const updatedPlayers = [...state.players];
            updatedPlayers[playerIndex] = {
                ...updatedPlayers[playerIndex],
                avatarId: action.avatarId
            };

            return withUpdate({
                ...state,
                players: updatedPlayers
            });
        }

        case 'VOTE_GAME': {
            if (state.phase !== PlatformPhase.GAME_VOTE && state.phase !== PlatformPhase.GAME_SELECT) {
                // For now, allow voting in LOBBY too if we want dynamic switching, but explicit phase is better.
                // Let's assume we are in LOBBY or GAME_VOTE
            }

            const newVotes = { ...state.gameVotes, [action.playerId]: action.gameId };

            return withUpdate({
                ...state,
                gameVotes: newVotes
            });
        }

        case 'START_GAME': {
            // Transitions to IN_GAME and initializes Secret Hitler
            if (state.phase !== PlatformPhase.LOBBY && state.phase !== PlatformPhase.JOIN && state.phase !== PlatformPhase.GAME_VOTE) {
                return { state, events: [{ type: 'ERROR', message: 'Cannot start game from current phase' } as PlatformEvent] };
            }

            // Validate player count (Secret Hitler needs 5-10)
            if (state.players.length < 5 || state.players.length > 10) {
                return { state, events: [{ type: 'ERROR', message: 'Need 5-10 players to start' } as PlatformEvent] };
            }

            // Check Game Selection (For now hardcoded to SH, but normally we'd check votes)
            // const selectedGame = determineWinner(state.gameVotes); // automated logic

            // Initialize SH Game State
            // Map Platform players to format expected by createLobbyState/initializeGame
            const playerIds = state.players.map(p => ({
                id: p.id,
                name: p.name,
                avatarId: p.avatarId
            }));

            // We use the Engine's gameReducer to handle the 'START_GAME' action which validates and initializes
            // First we need an initial "Lobby" state for the engine
            const initialEngineState = createLobbyState(state.ownerId);

            const actionForEngine: any = {
                type: 'START_GAME',
                playerId: action.playerId,
                playerIds: playerIds
            };

            const result = gameReducer(initialEngineState, actionForEngine);

            if (result.events.some(e => e.type === 'ERROR')) {
                const error = result.events.find(e => e.type === 'ERROR');
                return { state, events: [{ type: 'ERROR', message: error?.message || 'Engine Error' } as PlatformEvent] };
            }

            const newState: RoomState = {
                ...state,
                phase: PlatformPhase.IN_GAME,
                activeGame: {
                    gameId: 'secret-hitler',
                    gameState: result.state as SecretHitlerGameState
                }
            };

            return withUpdate(newState);
        }

        case 'GAME_ACTION': {
            if (state.phase !== PlatformPhase.IN_GAME || !state.activeGame) {
                return { state, events: [{ type: 'ERROR', message: 'Game not active' } as PlatformEvent] };
            }

            // Delegate to SH Engine
            const result = gameReducer(state.activeGame.gameState, action.action);

            const newState: RoomState = {
                ...state,
                activeGame: {
                    ...state.activeGame,
                    gameState: result.state as SecretHitlerGameState
                }
            };

            // Check for Game Over logic in SH to transition Platform Phase?
            // If SH State is GAME_OVER, maybe moving Platform to GAME_OVER?
            if (result.state.phase === 'GAME_OVER') { // String comparison or import Enum
                newState.phase = PlatformPhase.GAME_OVER;
            }

            return withUpdate(newState);
        }

        default:
            return { state, events: [] };
    }
}
