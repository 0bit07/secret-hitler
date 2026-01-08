/**
 * Executive action logic
 * 
 * MVP Implementation:
 * - Investigation (loyalty check)
 * - Execution (player kill)
 * 
 * Scaffolded (NotImplemented):
 * - Special Election
 * - Policy Peek
 */

import { GameState, GameEvent, Phase, Role } from '../types';
import { getNextPresidentIndex } from '../initializer';
import { checkHitlerKilled } from './winCondition';

/**
 * Investigate a player's loyalty (party affiliation)
 * President learns if target is Liberal or Fascist
 */
export function investigateLoyalty(
    state: GameState,
    targetId: string
): { state: GameState; events: GameEvent[] } {
    const events: GameEvent[] = [];

    const target = state.players.find(p => p.id === targetId);

    if (!target) {
        throw new Error('Invalid target for investigation');
    }

    const newState: GameState = {
        ...state,
        investigatedPlayer: targetId,
        investigatedPlayers: [...state.investigatedPlayers, targetId],
        pendingExecutiveAction: null,
    };

    // Advance to next round
    const nextPresidentIndex = getNextPresidentIndex(state.players, state.presidentIndex);

    newState.presidentIndex = nextPresidentIndex;
    newState.phase = Phase.NOMINATION;
    newState.nominatedChancellor = null;
    newState.players = state.players.map((p, idx) => ({
        ...p,
        isPresident: idx === nextPresidentIndex,
        isChancellor: false,
    }));

    events.push({
        type: 'LOYALTY_INVESTIGATED',
        presidentId: state.players[state.presidentIndex].id,
        targetId,
        party: target.party,
    });

    events.push({
        type: 'PRESIDENT_ROTATION',
        presidentId: newState.players[nextPresidentIndex].id,
    });

    events.push({
        type: 'PHASE_CHANGED',
        oldPhase: state.phase,
        newPhase: Phase.NOMINATION,
    });

    return { state: newState, events };
}

/**
 * Execute a player (kill them)
 * Checks if Hitler was killed (Liberal win)
 */
export function executePlayer(
    state: GameState,
    targetId: string
): { state: GameState; events: GameEvent[] } {
    const events: GameEvent[] = [];

    const target = state.players.find(p => p.id === targetId);

    if (!target) {
        throw new Error('Invalid target for execution');
    }

    const wasHitler = target.role === Role.HITLER;

    // Kill the player
    const newPlayers = state.players.map(p =>
        p.id === targetId ? { ...p, alive: false } : p
    );

    const newState: GameState = {
        ...state,
        players: newPlayers,
        pendingExecutiveAction: null,
    };

    events.push({
        type: 'PLAYER_EXECUTED',
        executorId: state.players[state.presidentIndex].id,
        targetId,
        wasHitler,
    });

    // Check if Hitler was killed
    const winCheck = checkHitlerKilled(targetId, newPlayers);

    if (winCheck.hasWinner) {
        newState.phase = Phase.GAME_OVER;
        newState.winner = winCheck.winner;
        newState.winReason = winCheck.reason;

        events.push({
            type: 'PHASE_CHANGED',
            oldPhase: state.phase,
            newPhase: Phase.GAME_OVER,
        });

        events.push({
            type: 'GAME_OVER',
            winner: winCheck.winner!,
            reason: winCheck.reason!,
        });
    } else {
        // Advance to next round
        const nextPresidentIndex = getNextPresidentIndex(newPlayers, state.presidentIndex);

        newState.presidentIndex = nextPresidentIndex;
        newState.phase = Phase.NOMINATION;
        newState.nominatedChancellor = null;
        newState.players = newPlayers.map((p, idx) => ({
            ...p,
            isPresident: idx === nextPresidentIndex,
            isChancellor: false,
        }));

        events.push({
            type: 'PRESIDENT_ROTATION',
            presidentId: newState.players[nextPresidentIndex].id,
        });

        events.push({
            type: 'PHASE_CHANGED',
            oldPhase: state.phase,
            newPhase: Phase.NOMINATION,
        });
    }

    return { state: newState, events };
}

/**
 * Special Election (SCAFFOLDED - Not Implemented)
 * President chooses next Presidential candidate
 */
export function specialElection(
    _state: GameState,
    _targetId: string
): { state: GameState; events: GameEvent[] } {
    throw new Error('Special Election is not yet implemented');
}

/**
 * Policy Peek (SCAFFOLDED - Not Implemented)
 * President views top 3 policies
 */
export function policyPeek(_state: GameState): { state: GameState; events: GameEvent[] } {
    throw new Error('Policy Peek is not yet implemented');
}
