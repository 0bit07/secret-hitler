/**
 * Legislative session logic
 * 
 * Handles:
 * - President drawing 3 policies
 * - President discarding 1 policy
 * - Chancellor receiving 2 policies
 * - Chancellor enacting 1 policy
 * - Triggering executive actions
 */

import { GameState, GameEvent, PolicyType, Phase, ExecutiveActionType } from '../types';
import { getNextPresidentIndex } from '../initializer';

/**
 * Draw 3 policies for the President
 * Called when entering LEGISLATIVE_PRESIDENT phase
 */
export function drawPolicies(state: GameState): { state: GameState; events: GameEvent[] } {
    const events: GameEvent[] = [];

    let deck = [...state.policyDeck];
    let discard = [...state.discardPile];

    // Check if we need to reshuffle
    if (deck.length < 3) {
        deck = [...deck, ...discard];
        discard = [];

        // Shuffle deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    // Draw 3 policies
    const presidentHand = deck.splice(0, 3);

    const newState: GameState = {
        ...state,
        policyDeck: deck,
        discardPile: discard,
        presidentHand,
    };

    events.push({
        type: 'POLICIES_DRAWN',
        presidentId: state.players[state.presidentIndex].id,
        count: 3,
    });

    return { state: newState, events };
}

/**
 * President discards one policy
 * Passes remaining 2 to Chancellor
 */
export function discardPolicy(
    state: GameState,
    policyIndex: number
): { state: GameState; events: GameEvent[] } {
    const events: GameEvent[] = [];

    const presidentHand = [...state.presidentHand];
    const discarded = presidentHand.splice(policyIndex, 1);

    const newState: GameState = {
        ...state,
        presidentHand: [],
        chancellorHand: presidentHand, // Remaining 2 policies
        discardPile: [...state.discardPile, ...discarded],
        phase: Phase.LEGISLATIVE_CHANCELLOR,
    };

    events.push({
        type: 'POLICY_DISCARDED_BY_PRESIDENT',
        presidentId: state.players[state.presidentIndex].id,
    });

    events.push({
        type: 'POLICIES_PASSED_TO_CHANCELLOR',
        chancellorId: state.nominatedChancellor!,
        count: 2,
    });

    events.push({
        type: 'PHASE_CHANGED',
        oldPhase: state.phase,
        newPhase: Phase.LEGISLATIVE_CHANCELLOR,
    });

    return { state: newState, events };
}

/**
 * Chancellor enacts one policy
 * Checks for executive actions and win conditions
 */
export function enactPolicy(
    state: GameState,
    policyIndex: number
): { state: GameState; events: GameEvent[] } {
    const events: GameEvent[] = [];

    const chancellorHand = [...state.chancellorHand];
    const enacted = chancellorHand.splice(policyIndex, 1)[0];

    const isLiberal = enacted === PolicyType.LIBERAL;

    const newLiberalCount = state.liberalPoliciesEnacted + (isLiberal ? 1 : 0);
    const newFascistCount = state.fascistPoliciesEnacted + (isLiberal ? 0 : 1);

    const newState: GameState = {
        ...state,
        chancellorHand: [],
        discardPile: [...state.discardPile, ...chancellorHand], // Discard remaining policy
        liberalPoliciesEnacted: newLiberalCount,
        fascistPoliciesEnacted: newFascistCount,
    };

    events.push({
        type: 'POLICY_ENACTED',
        policyType: enacted,
        liberalCount: newLiberalCount,
        fascistCount: newFascistCount,
    });

    // Check for executive action
    const executiveAction = getExecutiveAction(newFascistCount, state.players.length);

    if (!isLiberal && executiveAction) {
        newState.pendingExecutiveAction = executiveAction;
        newState.phase = Phase.EXECUTIVE_ACTION;

        events.push({
            type: 'EXECUTIVE_ACTION_UNLOCKED',
            actionType: executiveAction,
        });

        events.push({
            type: 'PHASE_CHANGED',
            oldPhase: state.phase,
            newPhase: Phase.EXECUTIVE_ACTION,
        });
    } else {
        // No executive action, advance to next round
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
 * Determine which executive action is triggered based on fascist policies and player count
 * Returns null if no executive action
 */
function getExecutiveAction(
    fascistPoliciesEnacted: number,
    playerCount: number
): ExecutiveActionType | null {
    if (fascistPoliciesEnacted === 1 && playerCount >= 9) {
        return 'investigate';
    }

    if (fascistPoliciesEnacted === 2 && playerCount >= 7) {
        return 'investigate';
    }

    if (fascistPoliciesEnacted === 3) {
        if (playerCount >= 7) {
            return 'special-election';
        } else {
            return 'policy-peek';
        }
    }

    if (fascistPoliciesEnacted === 4 || fascistPoliciesEnacted === 5) {
        return 'execution';
    }

    return null;
}
