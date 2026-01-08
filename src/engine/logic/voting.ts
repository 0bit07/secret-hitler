/**
 * Voting logic
 * 
 * Handles vote casting and tallying.
 * Checks Hitler election win condition.
 * Manages election tracker and chaos scenario.
 */

import { GameState, GameEvent, Vote, Phase, Player } from '../types';
import { checkHitlerElected } from './winCondition';
import { getNextPresidentIndex } from '../initializer';
import { drawPolicies } from './legislation';

/**
 * Process a vote cast by a player
 */
export function castVote(
    state: GameState,
    playerId: string,
    vote: Vote
): { state: GameState; events: GameEvent[] } {
    const events: GameEvent[] = [];

    // Add vote to state
    const newVotes = {
        ...state.votes,
        [playerId]: vote,
    };

    const newState: GameState = {
        ...state,
        votes: newVotes,
    };

    events.push({
        type: 'VOTE_CAST',
        playerId,
    });

    // Check if all alive players have voted
    const alivePlayers = state.players.filter(p => p.alive);
    const allVotesCast = alivePlayers.every(p => newVotes[p.id]);

    if (allVotesCast) {
        // Tally votes and complete election
        return completeVoting(newState);
    }

    return { state: newState, events };
}

/**
 * Complete voting after all votes are cast
 * Determines if election passed or failed
 */
function completeVoting(state: GameState): { state: GameState; events: GameEvent[] } {
    const events: GameEvent[] = [];

    // Count votes
    const jaVotes = Object.values(state.votes).filter(v => v === 'ja').length;
    const neinVotes = Object.values(state.votes).filter(v => v === 'nein').length;
    const passed = jaVotes > neinVotes;

    events.push({
        type: 'VOTING_COMPLETE',
        votes: state.votes,
        passed,
    });

    if (passed) {
        return handleElectionPassed(state, events);
    } else {
        return handleElectionFailed(state, events);
    }
}

/**
 * Handle successful election
 */
function handleElectionPassed(
    state: GameState,
    events: GameEvent[]
): { state: GameState; events: GameEvent[] } {
    // Check Hitler election win condition
    if (state.nominatedChancellor) {
        const hitlerCheck = checkHitlerElected(state, state.nominatedChancellor);

        if (hitlerCheck.hasWinner) {
            const newState: GameState = {
                ...state,
                phase: Phase.GAME_OVER,
                winner: hitlerCheck.winner,
                winReason: hitlerCheck.reason,
            };

            events.push({
                type: 'PHASE_CHANGED',
                oldPhase: state.phase,
                newPhase: Phase.GAME_OVER,
            });

            events.push({
                type: 'GAME_OVER',
                winner: hitlerCheck.winner!,
                reason: hitlerCheck.reason!,
            });

            return { state: newState, events };
        }
    }

    // Update government positions
    const newPlayers = state.players.map(p => {
        // Clear previous government flags
        const updatedPlayer: Player = {
            ...p,
            wasPresident: p.isPresident,
            wasChancellor: p.isChancellor,
            isPresident: false,
            isChancellor: false,
        };

        // Set new government
        if (p.id === state.players[state.presidentIndex].id) {
            updatedPlayer.isPresident = true;
        }
        if (p.id === state.nominatedChancellor) {
            updatedPlayer.isChancellor = true;
        }

        return updatedPlayer;
    });

    const newState: GameState = {
        ...state,
        players: newPlayers,
        phase: Phase.LEGISLATIVE_PRESIDENT,
        electionTracker: 0, // Reset election tracker on successful election
        votes: {}, // Clear votes
    };

    events.push({
        type: 'PHASE_CHANGED',
        oldPhase: state.phase,
        newPhase: Phase.LEGISLATIVE_PRESIDENT,
    });

    // CRITICAL FIX: Draw policies for the new legislative session
    const drawResult = drawPolicies(newState);
    const finalState = drawResult.state;
    const finalEvents = [...events, ...drawResult.events];

    return { state: finalState, events: finalEvents };
}

/**
 * Handle failed election
 */
function handleElectionFailed(
    state: GameState,
    events: GameEvent[]
): { state: GameState; events: GameEvent[] } {
    const newElectionTracker = state.electionTracker + 1;

    events.push({
        type: 'ELECTION_FAILED',
        electionTracker: newElectionTracker,
    });

    // Check for chaos (3 failed elections)
    if (newElectionTracker >= 3) {
        return handleChaos(state, events);
    }

    // Advance to next President
    const nextPresidentIndex = getNextPresidentIndex(state.players, state.presidentIndex);

    const newPlayers = state.players.map((p, idx) => ({
        ...p,
        isPresident: idx === nextPresidentIndex,
    }));

    const newState: GameState = {
        ...state,
        players: newPlayers,
        presidentIndex: nextPresidentIndex,
        electionTracker: newElectionTracker,
        phase: Phase.NOMINATION,
        nominatedChancellor: null,
        votes: {},
    };

    events.push({
        type: 'PRESIDENT_ROTATION',
        presidentId: newPlayers[nextPresidentIndex].id,
    });

    events.push({
        type: 'PHASE_CHANGED',
        oldPhase: state.phase,
        newPhase: Phase.NOMINATION,
    });

    return { state: newState, events };
}

/**
 * Handle chaos scenario (3 failed elections)
 * Top deck policy is enacted automatically
 */
function handleChaos(state: GameState, events: GameEvent[]): { state: GameState; events: GameEvent[] } {
    // Draw top policy from deck
    let deck = [...state.policyDeck];
    const topPolicy = deck.shift();

    if (!topPolicy) {
        // Reshuffle discard into deck if empty
        deck = [...state.discardPile];
        deck = shuffleArray(deck);
        const newTopPolicy = deck.shift();

        if (!newTopPolicy) {
            throw new Error('No policies available for chaos');
        }

        return enactChaosPolicy(state, events, newTopPolicy, deck, []);
    }

    return enactChaosPolicy(state, events, topPolicy, deck, state.discardPile);
}

function enactChaosPolicy(
    state: GameState,
    events: GameEvent[],
    policy: any,
    deck: any[],
    discard: any[]
): { state: GameState; events: GameEvent[] } {
    const isLiberal = policy === 'LIBERAL';

    const newState: GameState = {
        ...state,
        policyDeck: deck,
        discardPile: discard,
        liberalPoliciesEnacted: state.liberalPoliciesEnacted + (isLiberal ? 1 : 0),
        fascistPoliciesEnacted: state.fascistPoliciesEnacted + (isLiberal ? 0 : 1),
        electionTracker: 0, // Reset tracker
        phase: Phase.NOMINATION,
        nominatedChancellor: null,
        votes: {},
    };

    // Advance president
    const nextPresidentIndex = getNextPresidentIndex(state.players, state.presidentIndex);
    newState.presidentIndex = nextPresidentIndex;
    newState.players = state.players.map((p, idx) => ({
        ...p,
        isPresident: idx === nextPresidentIndex,
    }));

    events.push({
        type: 'CHAOS',
        policyEnacted: policy,
    });

    events.push({
        type: 'POLICY_ENACTED',
        policyType: policy,
        liberalCount: newState.liberalPoliciesEnacted,
        fascistCount: newState.fascistPoliciesEnacted,
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

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
