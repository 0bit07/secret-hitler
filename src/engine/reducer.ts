/**
 * Main Game Reducer
 * 
 * The core engine function that processes actions and updates state.
 * Pure, deterministic, and event-driven.
 */

import { GameState, Action, GameEvent, Phase, ReducerResult } from './types';
import { validateAction } from './validator';
import { initializeGame, createLobbyState } from './initializer';
import { nominateChancellor } from './logic/nomination';
import { castVote } from './logic/voting';
import { discardPolicy, enactPolicy } from './logic/legislation';
import {
    investigateLoyalty,
    executePlayer,
    specialElection,
    policyPeek
} from './logic/executiveAction';
import { checkWinCondition } from './logic/winCondition';

/**
 * Main reducer function
 * 
 * @param state - Current game state (or undefined for initial state)
 * @param action - Action to perform
 * @returns New state and emitted events
 */
export function gameReducer(
    state: GameState = createLobbyState(),
    action: Action
): ReducerResult {
    const events: GameEvent[] = [];

    // Special case: START_GAME (transition from Lobby)
    // We handle this outside generic validation because it requires checking lobby state
    if (action.type === 'START_GAME') {
        const validation = validateAction(state, action);
        if (!validation.valid) {
            return {
                state,
                events: [{ type: 'ERROR', message: validation.error || 'Invalid action' }]
            };
        }

        // Initialize game
        const { players, policyDeck, presidentIndex } = initializeGame(action.playerIds);

        const newState: GameState = {
            ...state,
            phase: Phase.ROLE_REVEAL,
            players,
            policyDeck,
            roleAcknowledgementCount: 0,
            presidentIndex,
            playersInLobby: action.playerIds, // Keep record of original players
        };

        events.push({
            type: 'GAME_STARTED',
            playerCount: players.length
        });

        // Emit private events for each player's role
        players.forEach(p => {
            events.push({
                type: 'ROLE_ASSIGNED',
                playerId: p.id,
                role: p.role,
                party: p.party
            });
        });

        events.push({
            type: 'PHASE_CHANGED',
            oldPhase: Phase.LOBBY,
            newPhase: Phase.ROLE_REVEAL
        });

        return { state: newState, events };
    }

    // Generic validation for all other actions
    const validation = validateAction(state, action);
    if (!validation.valid) {
        return {
            state,
            events: [{ type: 'ERROR', message: validation.error || 'Invalid action' }]
        };
    }

    // Helper to attach win checks to result
    const withWinCheck = (result: ReducerResult): ReducerResult => {
        // If game is already over, don't check again
        if (result.state.phase === Phase.GAME_OVER) {
            return result;
        }

        const winCheck = checkWinCondition(result.state);
        if (winCheck.hasWinner) {
            const finalState = {
                ...result.state,
                phase: Phase.GAME_OVER,
                winner: winCheck.winner,
                winReason: winCheck.reason
            };

            const finalEvents = [
                ...result.events,
                {
                    type: 'PHASE_CHANGED',
                    oldPhase: result.state.phase,
                    newPhase: Phase.GAME_OVER
                } as GameEvent,
                {
                    type: 'GAME_OVER',
                    winner: winCheck.winner!,
                    reason: winCheck.reason!
                } as GameEvent
            ];

            return { state: finalState, events: finalEvents };
        }

        return result;
    };

    // Dispatch based on action type
    try {
        switch (action.type) {
            case 'ACKNOWLEDGE_ROLE': {
                if (state.phase !== Phase.ROLE_REVEAL) return { state, events: [] };

                const playerIndex = state.players.findIndex(p => p.id === action.playerId);
                if (playerIndex === -1) return { state, events: [] };

                const player = state.players[playerIndex];
                if (player.hasSeenRole) return { state, events: [] }; // Idempotent

                const newPlayers = [...state.players];
                newPlayers[playerIndex] = { ...player, hasSeenRole: true };

                const newCount = state.roleAcknowledgementCount + 1;
                const allAcked = newCount >= state.players.length;

                let newState = {
                    ...state,
                    players: newPlayers,
                    roleAcknowledgementCount: newCount
                };

                const events: GameEvent[] = [];

                if (allAcked) {
                    newState = {
                        ...newState,
                        phase: Phase.NOMINATION
                    };
                    events.push({
                        type: 'PHASE_CHANGED',
                        oldPhase: Phase.ROLE_REVEAL,
                        newPhase: Phase.NOMINATION
                    });
                    events.push({
                        type: 'PRESIDENT_ROTATION',
                        presidentId: state.players[state.presidentIndex].id
                    } as any); // Cast because PRESIDENT_ROTATION might not be in defined Types yet?? Wait, I removed it? Checking types.
                }

                return { state: newState, events };
            }

            case 'ADVANCE_PHASE':
                // Only valid for ROLE_REVEAL -> NOMINATION currently
                if (state.phase === Phase.ROLE_REVEAL) {
                    return {
                        state: { ...state, phase: Phase.NOMINATION },
                        events: [{
                            type: 'PHASE_CHANGED',
                            oldPhase: Phase.ROLE_REVEAL,
                            newPhase: Phase.NOMINATION
                        }, {
                            type: 'PRESIDENT_ROTATION',
                            presidentId: state.players[state.presidentIndex].id
                        } as any]
                    };
                }
                return { state, events: [] }; // Should be caught by validator but safe fallback

            case 'NOMINATE_CHANCELLOR':
                return withWinCheck(nominateChancellor(state, action.chancellorId));

            case 'CAST_VOTE':
                return withWinCheck(castVote(state, action.playerId, action.vote));

            case 'DISCARD_POLICY':
                // President discards -> trigger Chancellor turn
                // Note: The legislation helper handles phase transition inside
                return withWinCheck(discardPolicy(state, action.policyIndex));

            case 'ENACT_POLICY':
                return withWinCheck(enactPolicy(state, action.policyIndex));

            case 'INVESTIGATE_LOYALTY':
                return withWinCheck(investigateLoyalty(state, action.targetId));

            case 'EXECUTE_PLAYER':
                return withWinCheck(executePlayer(state, action.targetId));

            case 'SPECIAL_ELECTION':
                return withWinCheck(specialElection(state, action.targetId));

            case 'POLICY_PEEK':
                return withWinCheck(policyPeek(state));

            default:
                // Should be unreachable due to validator and TS, but good for safety
                return { state, events: [] };
        }
    } catch (error: any) {
        // Catch errors from logic modules (e.g. NotImplemented)
        return {
            state,
            events: [{ type: 'ERROR', message: error.message || 'Internal engine error' }]
        };
    }
}
