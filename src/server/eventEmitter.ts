import { WebSocket } from 'ws';
import { GameEvent, GameState } from '../engine/types';
import { sanitizeStateForPlayer } from '../engine/utils/privacy';
import { RoomManager } from './roomManager';
import { ServerMessage } from './types';

function send(socket: WebSocket, message: ServerMessage) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    }
}

export class EventEmitter {
    /**
     * Broadcast an event to all players in a room.
     * Some events might be private, but most game events are public log items.
     * The `GameEvent` type in engine is designed to be mostly public, 
     * but things like "ROLE_ASSIGNED" are strictly private.
     * 
     * We need to check the event type to decide if it's broadcast-safe or target-only.
     */
    static emitGameEvents(roomId: string, events: GameEvent[]) {
        const sockets = RoomManager.getSocketsInRoom(roomId);

        for (const event of events) {
            // events that are strictly private
            if (event.type === 'ROLE_ASSIGNED') {
                // Only send to the specific player
                const targetSocket = RoomManager.getSocketForPlayer(event.playerId);
                if (targetSocket) {
                    send(targetSocket, { type: 'EVENT', event });
                }
                continue;
            }

            // Events that are semi-private or public
            // For now, assume all other events are public or safe to broadcast 
            // because strict info hiding is done in STATE, not necessarily in EVENTS.
            // However, "POLICY_DISCARDED_BY_PRESIDENT" doesn't reveal the policy.
            // "POLICIES_PEEKED" doesn't reveal content.
            // So mostly events are signals of "Something happened".
            // The STATE is where the actual sensitive data lives.

            // Broadcast to all in room
            for (const socket of sockets) {
                send(socket, { type: 'EVENT', event });
            }
        }
    }

    /**
     * Send updated state to all clients in a room.
     * MUST USE SANITIZERS.
     */
    static broadcastState(roomId: string, activeState: GameState) {


        // Iterate all active connections to this room
        // We can't use RoomManager.getSocketsInRoom easily because we need the playerId for sanitization
        // So we iterate the map logic manually or add a helper.
        // Let's assume RoomManager gives us sockets, but we need the ID.
        // Let's iterate RoomManager internals or use `getSocketForPlayer` if we knew all players.
        // Better: RoomManager should expose pairs of (socket, playerId).

        // Refactoring usage: iterating all sockets is inefficient if we don't have the mapped list.
        // Let's rely on RoomManager.getSocketsInRoom returning sockets, 
        // and then map socket -> playerId using RoomManager.getConnection(socket).

        const sockets = RoomManager.getSocketsInRoom(roomId);

        for (const socket of sockets) {
            const conn = RoomManager.getConnection(socket);
            if (!conn) continue;

            const sanitized = sanitizeStateForPlayer(activeState, conn.playerId);
            send(socket, { type: 'STATE_SYNC', state: sanitized });
        }
    }

    static sendError(socket: WebSocket, message: string) {
        send(socket, { type: 'ERROR', message });
    }
}
