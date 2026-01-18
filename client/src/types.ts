/**
 * Core type definitions for Secret Hitler game engine
 * Mirrored from server/src/engine/types.ts and server/src/server/types.ts
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum Role {
    LIBERAL = 'LIBERAL',
    FASCIST = 'FASCIST',
    HITLER = 'HITLER',
}

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

export enum PolicyType {
    LIBERAL = 'LIBERAL',
    FASCIST = 'FASCIST',
}

// ============================================================================
// PRIMITIVES
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
// STATE
// ============================================================================

export interface Player {
    id: string;
    name: string;
    role: Role;
    party: Party;
    alive: boolean;
    isPresident: boolean;
    isChancellor: boolean;
    wasPresident: boolean;
    wasChancellor: boolean;
    hasSeenRole: boolean;
    avatarId: string;
}

export interface SecretHitlerGameState {
    phase: Phase;
    players: Player[];
    ownerId?: string;
    playersInLobby: { id: string, name: string, avatarId: string }[];
    roleAcknowledgementCount: number;

    presidentIndex: number;
    nominatedChancellor: string | null;
    votes: Record<string, Vote>;
    // Election Tracker (0-3)
    electionTracker: number;
    liberalPoliciesEnacted: number;
    fascistPoliciesEnacted: number;
    // Client sees these as potentially undefined or hidden if not sanitized properly, 
    // but the type definition strictly follows the server shape.
    // However, the `sanitizeStateForPlayer` utility on the server may strip these.
    // For TypeScript safety, we'll keep them optional or strict based on what we expect the server to send.
    // The server sends `Partial<GameState>` effectively.
    // Let's copy the full shape but assume we receive sanitized versions.

    policyDeck?: PolicyType[]; // Hidden
    discardPile?: PolicyType[]; // Hidden
    presidentHand?: PolicyType[]; // Hidden/Private
    chancellorHand?: PolicyType[]; // Hidden/Private

    pendingExecutiveAction: ExecutiveActionType | null;
    investigatedPlayer: string | null;
    investigatedPlayers: string[];
    winner: Party | null;
    winReason: WinReason | null;
}

export type GameState = SecretHitlerGameState; // Alias for backward compatibility if needed, but we should switch

// ============================================================================
// PLATFORM STATE
// ============================================================================

export enum PlatformPhase {
    JOIN = 'JOIN',
    AVATAR_SELECT = 'AVATAR_SELECT',
    LOBBY = 'LOBBY',
    GAME_SELECT = 'GAME_SELECT',
    GAME_VOTE = 'GAME_VOTE',
    READY = 'READY',
    IN_GAME = 'IN_GAME',
    GAME_OVER = 'GAME_OVER'
}

export interface PlatformPlayer {
    id: string;
    name: string;
    avatarId: string;
    isReady: boolean;
    isHost: boolean;
}

export interface RoomState {
    id: string; // Room Code
    phase: PlatformPhase;
    players: PlatformPlayer[];
    activeGame?: {
        gameId: 'secret-hitler';
        gameState: SecretHitlerGameState;
    };
    gameVotes: Record<string, string>;
    ownerId: string;
    createdAt: number;
}

// ============================================================================
// ACTIONS
// ============================================================================

export type Action =
    | { type: 'START_GAME'; playerId: string; playerIds: Array<{ id: string; name: string; avatarId: string }> } // Legacy SH Action
    | { type: 'NOMINATE_CHANCELLOR'; playerId: string; chancellorId: string }
    | { type: 'CAST_VOTE'; playerId: string; vote: Vote }
    | { type: 'DISCARD_POLICY'; playerId: string; policyIndex: number }
    | { type: 'ENACT_POLICY'; playerId: string; policyIndex: number }
    | { type: 'INVESTIGATE_LOYALTY'; playerId: string; targetId: string }
    | { type: 'EXECUTE_PLAYER'; playerId: string; targetId: string }
    | { type: 'SPECIAL_ELECTION'; playerId: string; targetId: string }
    | { type: 'POLICY_PEEK'; playerId: string }
    | { type: 'ADVANCE_PHASE' } // Internal action to move to next phase
    | { type: 'CLOSE_ROOM'; playerId: string } // Host only
    | { type: 'ACKNOWLEDGE_ROLE'; playerId: string };

export type PlatformAction =
    | { type: 'SELECT_AVATAR'; roomId: string; playerId: string; avatarId: string }
    | { type: 'VOTE_GAME'; roomId: string; playerId: string; gameId: string }
    | { type: 'JOIN_ROOM'; roomId: string; playerId: string; avatarId?: string };


// ============================================================================
// EVENTS
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
    | { type: 'ROOM_CLOSED' }
    | { type: 'ERROR'; message: string };

// ============================================================================
// MESSAGING
// ============================================================================

export type ClientMessage = {
    type: 'ACTION';
    roomId: string;
    action: Action | PlatformAction; // Support both
    playerId: string;
};

export type ServerMessage =
    | { type: 'EVENT'; event: GameEvent }
    | { type: 'STATE_SYNC'; state: RoomState } // Now expecting RoomState
    | { type: 'ERROR'; message: string; code?: string };
