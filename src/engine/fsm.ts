/**
 * Finite State Machine definition for Secret Hitler
 * 
 * Defines phase transitions and valid actions per phase.
 * Ensures no illegal phase transitions or actions.
 */

import { Phase, Action } from './types';

/**
 * Valid phase transitions
 * Maps current phase to allowed next phases
 */
export const PHASE_TRANSITIONS: Record<Phase, Phase[]> = {
    [Phase.LOBBY]: [Phase.ROLE_REVEAL],
    [Phase.ROLE_REVEAL]: [Phase.NOMINATION],
    [Phase.NOMINATION]: [Phase.VOTING, Phase.GAME_OVER],
    [Phase.VOTING]: [Phase.NOMINATION, Phase.LEGISLATIVE_PRESIDENT, Phase.GAME_OVER],
    [Phase.LEGISLATIVE_PRESIDENT]: [Phase.LEGISLATIVE_CHANCELLOR],
    [Phase.LEGISLATIVE_CHANCELLOR]: [Phase.EXECUTIVE_ACTION, Phase.NOMINATION, Phase.GAME_OVER],
    [Phase.EXECUTIVE_ACTION]: [Phase.NOMINATION, Phase.GAME_OVER],
    [Phase.GAME_OVER]: [],

    // Legacy aliases (remove these if not needed)
    [Phase.LEGISLATION]: [Phase.EXECUTIVE_ACTION, Phase.NOMINATION, Phase.GAME_OVER],
};

/**
 * Check if a phase transition is valid
 */
export function isValidTransition(from: Phase, to: Phase): boolean {
    return PHASE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Valid action types per phase
 */
export const VALID_ACTIONS_PER_PHASE: Record<Phase, Action['type'][]> = {
    [Phase.LOBBY]: ['START_GAME', 'CLOSE_ROOM'],
    [Phase.ROLE_REVEAL]: ['ADVANCE_PHASE', 'ACKNOWLEDGE_ROLE', 'CLOSE_ROOM'],
    [Phase.NOMINATION]: ['NOMINATE_CHANCELLOR'],
    [Phase.VOTING]: ['CAST_VOTE'],
    [Phase.LEGISLATIVE_PRESIDENT]: ['DISCARD_POLICY'],
    [Phase.LEGISLATIVE_CHANCELLOR]: ['ENACT_POLICY'],
    [Phase.EXECUTIVE_ACTION]: [
        'INVESTIGATE_LOYALTY',
        'EXECUTE_PLAYER',
        'SPECIAL_ELECTION',
        'POLICY_PEEK',
    ],
    [Phase.GAME_OVER]: [],

    // Legacy
    [Phase.LEGISLATION]: ['DISCARD_POLICY', 'ENACT_POLICY'],
};

/**
 * Check if an action is valid for the current phase
 */
export function isActionValidForPhase(phase: Phase, actionType: Action['type']): boolean {
    return VALID_ACTIONS_PER_PHASE[phase]?.includes(actionType) ?? false;
}

/**
 * Get the expected next phase after a specific action
 * This is a helper for the reducer to determine phase transitions
 */
export function getNextPhaseAfterAction(currentPhase: Phase, action: Action): Phase | null {
    switch (action.type) {
        case 'START_GAME':
            return Phase.ROLE_REVEAL;

        case 'ADVANCE_PHASE':
            if (currentPhase === Phase.ROLE_REVEAL) return Phase.NOMINATION;
            return null;

        case 'NOMINATE_CHANCELLOR':
            return Phase.VOTING;

        case 'CAST_VOTE':
            // Will be determined after all votes are cast
            return null;

        case 'DISCARD_POLICY':
            return Phase.LEGISLATIVE_CHANCELLOR;

        case 'ENACT_POLICY':
            // Will be determined based on whether executive action is triggered
            return null;

        case 'INVESTIGATE_LOYALTY':
        case 'EXECUTE_PLAYER':
        case 'SPECIAL_ELECTION':
        case 'POLICY_PEEK':
            return Phase.NOMINATION;

        default:
            return null;
    }
}
