/**
 * Core type definitions for Secret Hitler game engine
 * 
 * This file defines all the types needed for the game state, actions, and events.
 * Only three enums are used (Role, Phase, PolicyType) - all other concepts use
 * string unions for flexibility.
 */

// ============================================================================
// ENUMS (Minimal - only 3)
// ============================================================================

/**
 * Player roles in Secret Hitler
 */
export enum Role {
    LIBERAL = 'LIBERAL',
    FASCIST = 'FASCIST',
    HITLER = 'HITLER',
}

/**
 * Game phases (Finite State Machine states)
 */
export enum Phase {
    LOBBY = 'LOBBY',
    ROLE_REVEAL = 'ROLE_REVEAL',
    NOMINATION = 'NOMINATION',
    VOTING = 'VOTING',
    LEGISLATION = 'LEGISLATION',
    LEGISLATIVE_PRESIDENT = 'LEGISLATIVE_PRESIDENT',
    LEGISLATIVE_CHANCELLOR = 'LEGISLATIVE_CHANCELLOR',
    EXECUTIVE_ACTION = 'EXECUTIVE_ACTION',
    GAME_OVER = 'GAME_OVER',
}

/**
 * Policy types
 */
export enum PolicyType {
    LIBERAL = 'LIBERAL',
    FASCIST = 'FASCIST',
}

// ============================================================================
// STRING UNIONS (Flexible types)
// ============================================================================

export type Party = 'liberal' | 'fascist';
export type Vote = 'ja' | 'nein';
export type ExecutiveActionType = 'investigate' | 'special-election' | 'policy-peek' | 'execution';
export type WinReason =
    | 'liberal-policies'
    | 'fascist-policies'
    | 'hitler-elected'
    | 'hitler-killed';

// ============================================================================
// PLAYER
// ============================================================================

export interface Player {
    id: string;
    name: string;
    role: Role;
    party: Party;
    alive: boolean;
    isPresident: boolean;
    isChancellor: boolean;
    /** True if this player was President in the last government */
    wasPresident: boolean;
    /** True if this player was Chancellor in the last government */
    wasChancellor: boolean;
}

// ============================================================================
// GAME STATE
// ============================================================================

export interface GameState {
    /** Current phase of the game */
    phase: Phase;

    /** All players in the game */
    players: Player[];

    /** Index of current Presidential candidate in players array */
    presidentIndex: number;

    /** ID of nominated Chancellor (null if not yet nominated) */
    nominatedChancellor: string | null;

    /** Votes cast in current election (playerId -> vote) */
    votes: Record<string, Vote>;

    /** Number of consecutive failed elections (0-2, resets on successful election) */
    electionTracker: number;

    /** Number of liberal policies enacted */
    liberalPoliciesEnacted: number;

    /** Number of fascist policies enacted */
    fascistPoliciesEnacted: number;

    /** 
     * Policy deck (hidden from players)
     * Initially 6 liberal + 11 fascist, shuffled
     */
    policyDeck: PolicyType[];

    /** 
     * Discarded policies (hidden from players)
     */
    discardPile: PolicyType[];

    /**
     * Policies currently in President's hand (3 policies drawn)
     */
    presidentHand: PolicyType[];

    /**
     * Policies currently in Chancellor's hand (2 policies after President discards)
     */
    chancellorHand: PolicyType[];

    /**
     * Active executive action type (if any)
     */
    pendingExecutiveAction: ExecutiveActionType | null;

    /**
     * Player ID being investigated (for investigate action)
     */
    investigatedPlayer: string | null;

    /**
     * Players who have been investigated (cannot be investigated again)
     */
    investigatedPlayers: string[];

    /**
     * Winner party (null if game ongoing)
     */
    winner: Party | null;

    /**
     * Reason for win/loss
     */
    winReason: WinReason | null;
    ownerId: string | null;

    /**
     * Players in lobby (before game starts)
     */
    playersInLobby: Array<{ id: string; name: string }>;
}

// ============================================================================
// ACTIONS (Discriminated Union)
// ============================================================================

export type Action =
    | { type: 'START_GAME'; playerId: string; playerIds: Array<{ id: string; name: string }> }
    | { type: 'NOMINATE_CHANCELLOR'; playerId: string; chancellorId: string }
    | { type: 'CAST_VOTE'; playerId: string; vote: Vote }
    | { type: 'DISCARD_POLICY'; playerId: string; policyIndex: number }
    | { type: 'ENACT_POLICY'; playerId: string; policyIndex: number }
    | { type: 'INVESTIGATE_LOYALTY'; playerId: string; targetId: string }
    | { type: 'EXECUTE_PLAYER'; playerId: string; targetId: string }
    | { type: 'SPECIAL_ELECTION'; playerId: string; targetId: string }
    | { type: 'POLICY_PEEK'; playerId: string }
    | { type: 'ADVANCE_PHASE' }; // Internal action to move to next phase

// ============================================================================
// EVENTS (Discriminated Union - UI-consumable)
// ============================================================================

export type GameEvent =
    | { type: 'GAME_STARTED'; playerCount: number }
    | { type: 'ROLE_ASSIGNED'; playerId: string; role: Role; party: Party }
    | { type: 'PHASE_CHANGED'; oldPhase: Phase; newPhase: Phase }
    | { type: 'PRESIDENT_ROTATION'; presidentId: string }
    | { type: 'CHANCELLOR_NOMINATED'; presidentId: string; chancellorId: string }
    | { type: 'VOTE_CAST'; playerId: string } // Don't reveal vote yet
    | { type: 'VOTING_COMPLETE'; votes: Record<string, Vote>; passed: boolean }
    | { type: 'ELECTION_FAILED'; electionTracker: number }
    | { type: 'CHAOS'; policyEnacted: PolicyType } // Top deck after 3 failed elections
    | { type: 'POLICIES_DRAWN'; presidentId: string; count: number }
    | { type: 'POLICY_DISCARDED_BY_PRESIDENT'; presidentId: string }
    | { type: 'POLICIES_PASSED_TO_CHANCELLOR'; chancellorId: string; count: number }
    | { type: 'POLICY_ENACTED'; policyType: PolicyType; liberalCount: number; fascistCount: number }
    | { type: 'EXECUTIVE_ACTION_UNLOCKED'; actionType: ExecutiveActionType }
    | { type: 'LOYALTY_INVESTIGATED'; presidentId: string; targetId: string; party: Party }
    | { type: 'PLAYER_EXECUTED'; executorId: string; targetId: string; wasHitler: boolean }
    | { type: 'SPECIAL_ELECTION_CALLED'; targetId: string }
    | { type: 'POLICIES_PEEKED'; presidentId: string }
    | { type: 'GAME_OVER'; winner: Party; reason: WinReason }
    | { type: 'ERROR'; message: string };

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

// ============================================================================
// REDUCER RETURN TYPE
// ============================================================================

export interface ReducerResult {
    state: GameState;
    events: GameEvent[];
}
