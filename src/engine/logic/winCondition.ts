/**
 * Win condition checking logic
 * 
 * Checks all four win conditions:
 * 1. Liberals win: 5 liberal policies enacted
 * 2. Fascists win: 6 fascist policies enacted
 * 3. Fascists win: Hitler elected Chancellor after 3 fascist policies
 * 4. Liberals win: Hitler killed
 */

import { GameState, Party, WinReason, Role, Player } from '../types';

export interface WinConditionResult {
    hasWinner: boolean;
    winner: Party | null;
    reason: WinReason | null;
}

/**
 * Check all win conditions
 * Returns winner and reason if any win condition is met
 */
export function checkWinCondition(state: GameState): WinConditionResult {
    // Check liberal policy victory
    if (state.liberalPoliciesEnacted >= 5) {
        return {
            hasWinner: true,
            winner: 'liberal',
            reason: 'liberal-policies',
        };
    }

    // Check fascist policy victory
    if (state.fascistPoliciesEnacted >= 6) {
        return {
            hasWinner: true,
            winner: 'fascist',
            reason: 'fascist-policies',
        };
    }

    // No winner yet
    return {
        hasWinner: false,
        winner: null,
        reason: null,
    };
}

/**
 * Check if Hitler was elected Chancellor after 3 fascist policies
 * This is a special check done during voting
 */
export function checkHitlerElected(state: GameState, chancellorId: string): WinConditionResult {
    if (state.fascistPoliciesEnacted >= 3) {
        const chancellor = state.players.find(p => p.id === chancellorId);
        if (chancellor?.role === Role.HITLER) {
            return {
                hasWinner: true,
                winner: 'fascist',
                reason: 'hitler-elected',
            };
        }
    }

    return {
        hasWinner: false,
        winner: null,
        reason: null,
    };
}

/**
 * Check if Hitler was killed
 * This is checked after execution
 */
export function checkHitlerKilled(executedPlayerId: string, players: Player[]): WinConditionResult {
    const executedPlayer = players.find(p => p.id === executedPlayerId);

    if (executedPlayer?.role === Role.HITLER) {
        return {
            hasWinner: true,
            winner: 'liberal',
            reason: 'hitler-killed',
        };
    }

    return {
        hasWinner: false,
        winner: null,
        reason: null,
    };
}
