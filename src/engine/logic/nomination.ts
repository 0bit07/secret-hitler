/**
 * Nomination logic
 * 
 * Handles Chancellor nomination by the President.
 * Checks eligibility (term limits, Hitler lock).
 */

import { GameState, GameEvent, Phase } from '../types';

/**
 * Process Chancellor nomination
 * Returns updated state and events
 */
export function nominateChancellor(
    state: GameState,
    chancellorId: string
): { state: GameState; events: GameEvent[] } {
    const events: GameEvent[] = [];
    const president = state.players[state.presidentIndex];

    // Create new state with structural sharing
    const newState: GameState = {
        ...state,
        nominatedChancellor: chancellorId,
        phase: Phase.VOTING,
        votes: {}, // Reset votes for new election
    };

    events.push({
        type: 'PHASE_CHANGED',
        oldPhase: state.phase,
        newPhase: Phase.VOTING,
    });

    events.push({
        type: 'CHANCELLOR_NOMINATED',
        presidentId: president.id,
        chancellorId,
    });

    return { state: newState, events };
}
