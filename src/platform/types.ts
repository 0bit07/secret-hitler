
import { GameState as SecretHitlerGameState } from '../engine/types';

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
    gameVotes: Record<string, string>; // playerId -> gameId
    ownerId: string;
    createdAt: number;
}

// Actions
export type PlatformAction =
    | { type: 'CREATE_ROOM'; roomId: string; playerId: string; avatarId?: string }
    | { type: 'JOIN_ROOM'; roomId: string; playerId: string; avatarId?: string }
    | { type: 'LEAVE_ROOM'; roomId: string; playerId: string }
    | { type: 'SELECT_AVATAR'; roomId: string; playerId: string; avatarId: string } // [NEW]
    | { type: 'VOTE_GAME'; roomId: string; playerId: string; gameId: string } // [NEW]
    | { type: 'START_GAME'; roomId: string; playerId: string } // Triggers transition to IN_GAME
    | { type: 'GAME_ACTION'; roomId: string; playerId: string; action: any }; // Wraps game-specific actions

// Events
export type PlatformEvent =
    | { type: 'ROOM_UPDATED'; state: RoomState }
    | { type: 'ERROR'; message: string };
