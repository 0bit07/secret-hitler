/**
 * Action validation logic
 * 
 * Validates actions before they're processed by the reducer.
 * Checks authorization, phase validity, and target validity.
 */

import { GameState, Action, ValidationResult, Phase } from './types';
import { isActionValidForPhase } from './fsm';

/**
 * Validate any action against current game state
 * Returns validation result with error message if invalid
 */
export function validateAction(state: GameState, action: Action): ValidationResult {
    // Check if game is over
    if (state.phase === Phase.GAME_OVER) {
        return { valid: false, error: 'Game is already over' };
    }

    // Check if action is valid for current phase
    if (!isActionValidForPhase(state.phase, action.type)) {
        return {
            valid: false,
            error: `Action ${action.type} is not valid in phase ${state.phase}`
        };
    }

    // Action-specific validation
    switch (action.type) {
        case 'START_GAME':
            return validateStartGame(state, action);

        case 'NOMINATE_CHANCELLOR':
            return validateNominateChancellor(state, action);

        case 'CAST_VOTE':
            return validateCastVote(state, action);

        case 'DISCARD_POLICY':
            return validateDiscardPolicy(state, action);

        case 'ENACT_POLICY':
            return validateEnactPolicy(state, action);

        case 'INVESTIGATE_LOYALTY':
            return validateInvestigateLoyalty(state, action);

        case 'EXECUTE_PLAYER':
            return validateExecutePlayer(state, action);

        case 'SPECIAL_ELECTION':
            return validateSpecialElection(state, action);

        case 'POLICY_PEEK':
            return validatePolicyPeek(state, action);

        case 'ADVANCE_PHASE':
            return { valid: true };

        default:
            return { valid: false, error: 'Unknown action type' };
    }
}

// ============================================================================
// Action-specific validators
// ============================================================================

function validateStartGame(state: GameState, action: Action & { type: 'START_GAME' }): ValidationResult {
    const playerCount = action.playerIds.length;

    if (playerCount < 5 || playerCount > 10) {
        return { valid: false, error: 'Game requires 5-10 players' };
    }

    // Check for duplicate names
    const names = action.playerIds.map(p => p.name);
    if (new Set(names).size !== names.length) {
        return { valid: false, error: 'Player names must be unique' };
    }

    // Only owner can start game (if owner is set)
    if (state.ownerId && action.playerId !== state.ownerId) {
        return { valid: false, error: 'Only the room owner can start the game' };
    }

    return { valid: true };
}

function validateNominateChancellor(
    state: GameState,
    action: Action & { type: 'NOMINATE_CHANCELLOR' }
): ValidationResult {
    const president = state.players[state.presidentIndex];

    // Check if action is from current President
    if (action.playerId !== president.id) {
        return { valid: false, error: 'Only the President can nominate a Chancellor' };
    }

    // Check if President is alive
    if (!president.alive) {
        return { valid: false, error: 'Dead players cannot nominate' };
    }

    const chancellor = state.players.find(p => p.id === action.chancellorId);

    // Check if chancellor exists
    if (!chancellor) {
        return { valid: false, error: 'Invalid chancellor ID' };
    }

    // Check if chancellor is alive
    if (!chancellor.alive) {
        return { valid: false, error: 'Cannot nominate dead player' };
    }

    // Cannot nominate self
    if (action.chancellorId === president.id) {
        return { valid: false, error: 'President cannot nominate themselves' };
    }

    // Cannot nominate last President (term limit)
    if (chancellor.wasPresident) {
        return { valid: false, error: 'Cannot nominate the previous President' };
    }

    // Cannot nominate last Chancellor (term limit)
    if (chancellor.wasChancellor) {
        return { valid: false, error: 'Cannot nominate the previous Chancellor' };
    }

    return { valid: true };
}

function validateCastVote(state: GameState, action: Action & { type: 'CAST_VOTE' }): ValidationResult {
    const player = state.players.find(p => p.id === action.playerId);

    if (!player) {
        return { valid: false, error: 'Invalid player ID' };
    }

    if (!player.alive) {
        return { valid: false, error: 'Dead players cannot vote' };
    }

    // Check if player already voted
    if (state.votes[action.playerId]) {
        return { valid: false, error: 'Player has already voted' };
    }

    return { valid: true };
}

function validateDiscardPolicy(
    state: GameState,
    action: Action & { type: 'DISCARD_POLICY' }
): ValidationResult {
    const president = state.players[state.presidentIndex];

    if (action.playerId !== president.id) {
        return { valid: false, error: 'Only the President can discard a policy' };
    }

    if (!president.alive) {
        return { valid: false, error: 'Dead players cannot discard policies' };
    }

    if (action.policyIndex < 0 || action.policyIndex >= state.presidentHand.length) {
        return { valid: false, error: 'Invalid policy index' };
    }

    return { valid: true };
}

function validateEnactPolicy(
    state: GameState,
    action: Action & { type: 'ENACT_POLICY' }
): ValidationResult {
    if (!state.nominatedChancellor) {
        return { valid: false, error: 'No Chancellor nominated' };
    }

    if (action.playerId !== state.nominatedChancellor) {
        return { valid: false, error: 'Only the Chancellor can enact a policy' };
    }

    const chancellor = state.players.find(p => p.id === action.playerId);
    if (!chancellor?.alive) {
        return { valid: false, error: 'Dead players cannot enact policies' };
    }

    if (action.policyIndex < 0 || action.policyIndex >= state.chancellorHand.length) {
        return { valid: false, error: 'Invalid policy index' };
    }

    return { valid: true };
}

function validateInvestigateLoyalty(
    state: GameState,
    action: Action & { type: 'INVESTIGATE_LOYALTY' }
): ValidationResult {
    const president = state.players[state.presidentIndex];

    if (action.playerId !== president.id) {
        return { valid: false, error: 'Only the President can investigate' };
    }

    if (!president.alive) {
        return { valid: false, error: 'Dead players cannot investigate' };
    }

    const target = state.players.find(p => p.id === action.targetId);

    if (!target) {
        return { valid: false, error: 'Invalid target ID' };
    }

    if (!target.alive) {
        return { valid: false, error: 'Cannot investigate dead player' };
    }

    if (action.targetId === president.id) {
        return { valid: false, error: 'Cannot investigate yourself' };
    }

    // Check if already investigated
    if (state.investigatedPlayers.includes(action.targetId)) {
        return { valid: false, error: 'Player has already been investigated' };
    }

    return { valid: true };
}

function validateExecutePlayer(
    state: GameState,
    action: Action & { type: 'EXECUTE_PLAYER' }
): ValidationResult {
    const president = state.players[state.presidentIndex];

    if (action.playerId !== president.id) {
        return { valid: false, error: 'Only the President can execute' };
    }

    if (!president.alive) {
        return { valid: false, error: 'Dead players cannot execute' };
    }

    const target = state.players.find(p => p.id === action.targetId);

    if (!target) {
        return { valid: false, error: 'Invalid target ID' };
    }

    if (!target.alive) {
        return { valid: false, error: 'Cannot execute dead player' };
    }

    if (action.targetId === president.id) {
        return { valid: false, error: 'Cannot execute yourself' };
    }

    return { valid: true };
}

function validateSpecialElection(
    state: GameState,
    action: Action & { type: 'SPECIAL_ELECTION' }
): ValidationResult {
    const president = state.players[state.presidentIndex];

    if (action.playerId !== president.id) {
        return { valid: false, error: 'Only the President can call special election' };
    }

    const target = state.players.find(p => p.id === action.targetId);

    if (!target) {
        return { valid: false, error: 'Invalid target ID' };
    }

    if (!target.alive) {
        return { valid: false, error: 'Cannot elect dead player' };
    }

    return { valid: true };
}

function validatePolicyPeek(
    state: GameState,
    action: Action & { type: 'POLICY_PEEK' }
): ValidationResult {
    const president = state.players[state.presidentIndex];

    if (action.playerId !== president.id) {
        return { valid: false, error: 'Only the President can peek at policies' };
    }

    if (!president.alive) {
        return { valid: false, error: 'Dead players cannot peek' };
    }

    if (state.policyDeck.length < 3) {
        return { valid: false, error: 'Not enough policies in deck to peek' };
    }

    return { valid: true };
}
