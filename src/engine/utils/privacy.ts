/**
 * Information hiding utilities
 * 
 * These functions sanitize game state to prevent information leakage.
 * Different views are provided for players vs spectators.
 */

import { GameState, Role } from '../types';

/**
 * Create a shallow clone of state with specific fields hidden
 * This uses structural sharing - only creates new objects for modified branches
 */
export function sanitizeStateForPlayer(state: GameState, playerId: string): Partial<GameState> {
    // Find the player
    const player = state.players.find(p => p.id === playerId);

    if (!player) {
        return sanitizeStateForSpectator(state);
    }

    // Base sanitized state - reuse references where possible
    const sanitized: Partial<GameState> = {
        phase: state.phase,
        presidentIndex: state.presidentIndex,
        nominatedChancellor: state.nominatedChancellor,
        electionTracker: state.electionTracker,
        liberalPoliciesEnacted: state.liberalPoliciesEnacted,
        fascistPoliciesEnacted: state.fascistPoliciesEnacted,
        winner: state.winner,
        winReason: state.winReason,
        pendingExecutiveAction: state.pendingExecutiveAction,

        // Hide roles of other players
        players: state.players.map(p => {
            // Player can see their own role
            if (p.id === playerId) {
                return p;
            }

            // Fascists see other Fascists and Hitler (ALL non-Liberals)
            if (player.role === Role.FASCIST && p.role !== Role.LIBERAL) {
                return p;
            }

            // Hitler sees Fascists ONLY in 5-6 player games
            if (player.role === Role.HITLER && p.role === Role.FASCIST && state.players.length <= 6) {
                return p;
            }

            // Otherwise hide role/party
            return {
                ...p,
                role: Role.LIBERAL, // Fake role
                party: 'liberal' as const,
            };
        }),

        // Only show votes after all votes are cast
        votes: Object.keys(state.votes).length === state.players.filter(p => p.alive).length
            ? state.votes
            : {},

        // Show hands only to relevant players
        presidentHand: state.players[state.presidentIndex]?.id === playerId
            ? state.presidentHand
            : [],
        chancellorHand: state.nominatedChancellor === playerId
            ? state.chancellorHand
            : [],

        // Hide deck and discard
        policyDeck: [],
        discardPile: [],

        // Show investigation results only to President
        investigatedPlayer: state.players[state.presidentIndex]?.id === playerId
            ? state.investigatedPlayer
            : null,
        investigatedPlayers: state.investigatedPlayers,
    };

    return sanitized;
}

/**
 * Create a completely sanitized state for spectators
 * Hides all secret information
 */
export function sanitizeStateForSpectator(state: GameState): Partial<GameState> {
    return {
        phase: state.phase,
        presidentIndex: state.presidentIndex,
        nominatedChancellor: state.nominatedChancellor,
        electionTracker: state.electionTracker,
        liberalPoliciesEnacted: state.liberalPoliciesEnacted,
        fascistPoliciesEnacted: state.fascistPoliciesEnacted,
        winner: state.winner,
        winReason: state.winReason,
        pendingExecutiveAction: state.pendingExecutiveAction,

        // Hide all roles
        players: state.players.map(p => ({
            ...p,
            role: Role.LIBERAL,
            party: 'liberal' as const,
        })),

        // Show votes only after all cast
        votes: Object.keys(state.votes).length === state.players.filter(p => p.alive).length
            ? state.votes
            : {},

        // Hide all hands and deck
        presidentHand: [],
        chancellorHand: [],
        policyDeck: [],
        discardPile: [],
        investigatedPlayer: null,
        investigatedPlayers: [],
    };
}
