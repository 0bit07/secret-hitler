import { Action, GameEvent, GameState } from '../engine/types';

/**
 * Messages sent from Client to Server
 */
export type ClientMessage = {
    type: 'ACTION';
    roomId: string;
    action: Action;
    // playerId is usually inferred from the socket/auth, but for this stateless design
    // we might accept it in the message if we aren't doing strict auth yet.
    // However, the prompt says "playerId: string" in the structure.
    playerId: string;
};

/**
 * Messages sent from Server to Client
 */
export type ServerMessage =
    | {
        type: 'EVENT';
        event: GameEvent;
    }
    | {
        type: 'STATE_SYNC';
        state: Partial<GameState>; // Sanitized state
    }
    | {
        type: 'ERROR';
        message: string;
        code?: string;
    };

export interface SocketData {
    playerId?: string;
    roomId?: string;
}
