import { WebSocket } from 'ws';

interface PlayerConnection {
    socket: WebSocket;
    playerId: string;
    roomId: string;
}

// Maps socket -> Connection Details
const socketMap = new Map<WebSocket, PlayerConnection>();

// Maps roomId -> Set<playerId> (For quick room lookups)
// Note: This is local process state. In a multi-server setup, we'd need Redis Pub/Sub.
// For this task, we assume "Horizontal Scaling" support via stateless design,
// means sticky sessions or Redis Pub/Sub would be added later.
// However, the prompt asks for "Scales horizontally (stateless server)".
// If the server is truly stateless, it shouldn't hold game logical state, but it MUST hold socket references.
// To broadcast to a room in a multi-server setup, we would typically subscribe to a Redis channel "room:{id}".
// For this implementation, I will implement local tracking, and acknowledge that Redis Pub/Sub is the next step for multi-node.
// The prompt says "Stateless Server ... All authoritative game state must live in Redis".
// It doesn't explicitly demand Redis Pub/Sub for the initial version, but it's good practice.
// I will keep it simple: Local Room Manager for now. If a player is connected to THIS server, we send to them.

export class RoomManager {
    static addConnection(socket: WebSocket, playerId: string, roomId: string) {
        socketMap.set(socket, { socket, playerId, roomId });
    }

    static removeConnection(socket: WebSocket) {
        socketMap.delete(socket);
    }

    static getConnection(socket: WebSocket): PlayerConnection | undefined {
        return socketMap.get(socket);
    }

    static getSocketForPlayer(playerId: string): WebSocket | undefined {
        for (const conn of socketMap.values()) {
            if (conn.playerId === playerId) {
                return conn.socket;
            }
        }
        return undefined;
    }

    static getSocketsInRoom(roomId: string): WebSocket[] {
        const sockets: WebSocket[] = [];
        for (const conn of socketMap.values()) {
            if (conn.roomId === roomId) {
                sockets.push(conn.socket);
            }
        }
        return sockets;
    }

    /**
     * Get all player IDs currently connected to this server for a given room
     */
    static getConnectedPlayerIds(roomId: string): string[] {
        const ids: string[] = [];
        for (const conn of socketMap.values()) {
            if (conn.roomId === roomId) {
                ids.push(conn.playerId);
            }
        }
        return ids;
    }
}
