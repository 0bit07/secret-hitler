/**
 * Game initialization logic
 * 
 * Handles role assignment, deck creation, and initial state setup.
 * Uses Fisher-Yates shuffle for randomness.
 */

import { GameState, Player, Role, PolicyType, Phase } from './types';
import { shuffle } from './utils/shuffle';

/**
 * Role distribution by player count
 * Based on official Secret Hitler rules
 */
const ROLE_DISTRIBUTION: Record<number, { liberals: number; fascists: number; hitler: number }> = {
    5: { liberals: 3, fascists: 1, hitler: 1 },
    6: { liberals: 4, fascists: 1, hitler: 1 },
    7: { liberals: 4, fascists: 2, hitler: 1 },
    8: { liberals: 5, fascists: 2, hitler: 1 },
    9: { liberals: 5, fascists: 3, hitler: 1 },
    10: { liberals: 6, fascists: 3, hitler: 1 },
};

/**
 * Create initial lobby state
 */
export function createLobbyState(ownerId: string | null = null): GameState {
    return {
        phase: Phase.LOBBY,
        ownerId,
        players: [],
        presidentIndex: 0,
        nominatedChancellor: null,
        votes: {},
        electionTracker: 0,
        liberalPoliciesEnacted: 0,
        fascistPoliciesEnacted: 0,
        policyDeck: [],
        discardPile: [],
        presidentHand: [],
        chancellorHand: [],
        pendingExecutiveAction: null,
        investigatedPlayer: null,
        investigatedPlayers: [],
        winner: null,
        winReason: null,
        playersInLobby: [],
    };
}

/**
 * Assign roles to players based on player count
 * Uses Fisher-Yates shuffle for randomness
 */
export function assignRoles(playerIds: Array<{ id: string; name: string }>): Player[] {
    const playerCount = playerIds.length;
    const distribution = ROLE_DISTRIBUTION[playerCount];

    if (!distribution) {
        throw new Error(`Invalid player count: ${playerCount}. Must be 5-10.`);
    }

    // Create role array
    const roles: Role[] = [
        ...Array(distribution.liberals).fill(Role.LIBERAL),
        ...Array(distribution.fascists).fill(Role.FASCIST),
        ...Array(distribution.hitler).fill(Role.HITLER),
    ];

    // Shuffle roles
    shuffle(roles);

    // Assign roles to players
    return playerIds.map((p, index) => ({
        id: p.id,
        name: p.name,
        role: roles[index],
        party: roles[index] === Role.LIBERAL ? 'liberal' : 'fascist',
        alive: true,
        isPresident: false,
        isChancellor: false,
        wasPresident: false,
        wasChancellor: false,
    }));
}

/**
 * Create and shuffle the policy deck
 * 6 Liberal + 11 Fascist = 17 total
 */
export function createPolicyDeck(): PolicyType[] {
    const deck: PolicyType[] = [
        ...Array(6).fill(PolicyType.LIBERAL),
        ...Array(11).fill(PolicyType.FASCIST),
    ];

    shuffle(deck);

    return deck;
}

/**
 * Initialize a new game from lobby
 * Assigns roles, creates deck, sets first President
 */
export function initializeGame(
    playerIds: Array<{ id: string; name: string }>
): { players: Player[]; policyDeck: PolicyType[]; presidentIndex: number } {
    const players = assignRoles(playerIds);
    const policyDeck = createPolicyDeck();

    // Randomly select first President
    const presidentIndex = Math.floor(Math.random() * players.length);
    players[presidentIndex].isPresident = true;

    return {
        players,
        policyDeck,
        presidentIndex,
    };
}

/**
 * Reshuffle discard pile into deck when deck runs out
 */
export function reshuffleDeck(deck: PolicyType[], discardPile: PolicyType[]): PolicyType[] {
    const newDeck = [...deck, ...discardPile];
    shuffle(newDeck);
    return newDeck;
}

/**
 * Get next president index (rotates clockwise, skips dead players)
 */
export function getNextPresidentIndex(players: Player[], currentIndex: number): number {
    let nextIndex = (currentIndex + 1) % players.length;

    // Skip dead players
    while (!players[nextIndex].alive) {
        nextIndex = (nextIndex + 1) % players.length;
    }

    return nextIndex;
}
