import { WebSocketServer, WebSocket } from 'ws';
import http, { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { RoomManager } from './roomManager';
import { loadGameState, saveGameState } from './redisStore';

import { ClientMessage } from './types';
import { RoomState, PlatformPhase, PlatformAction } from '../platform/types';
import { platformReducer } from '../platform/reducer';
import { SessionManager } from '../platform/session';


export class SocketServer {
    private wss: WebSocketServer;
    private httpServer: http.Server;

    constructor(port: number) {
        // 1. Create a standard HTTP server to handle Health Checks (Railway requires this)
        this.httpServer = http.createServer((req: IncomingMessage, res: ServerResponse) => {
            if (req.method === 'GET' && req.url === '/health') {
                res.writeHead(200);
                res.end('OK');
                return;
            }
            res.writeHead(404);
            res.end();
        });

        // 2. Attach WebSocket Server to the HTTP Instance
        this.wss = new WebSocketServer({ server: this.httpServer });

        // 3. Start Listening
        this.httpServer.listen(port, () => {
            console.log(`🚀 Server started on port ${port} (HTTP + WS)`);
            console.log(`   Health Check: http://localhost:${port}/health`);
        });

        this.wss.on('connection', this.handleConnection.bind(this));
    }

    private async handleConnection(socket: WebSocket, req: IncomingMessage) {
        try {
            const url = new URL(req.url || '', 'http://localhost');
            const roomId = url.searchParams.get('roomId');
            let playerId = url.searchParams.get('playerId');
            const token = url.searchParams.get('token');
            const avatarId = url.searchParams.get('avatarId') || 'avatar-01';
            const mode = url.searchParams.get('mode') || 'join';

            if (!roomId) {
                socket.close(1008, 'Missing roomId');
                return;
            }

            // Session Management
            if (token) {
                if (SessionManager.validateSession(token)) {
                    const session = SessionManager.getSession(token);
                    if (session && session.roomId === roomId) {
                        playerId = session.playerId;
                    } else {
                        socket.close(1008, 'Invalid Session');
                        return;
                    }
                } else {
                    socket.close(1008, 'Invalid Token');
                    return;
                }
            } else if (playerId) {
                // Fallback / Legacy: Create session for this player
                // In real auth, we'd verify player, but here we trust them (or upgrading interaction)
                SessionManager.createSession(playerId, roomId);
                // We should ideally send this token back to client, but client doesn't expect it yet.
                // We'll proceed with playerId.
            } else {
                socket.close(1008, 'Missing Identity');
                return;
            }

            if (!playerId) {
                socket.close(1008, 'Unknown Player'); // Should be covered above
                return;
            }

            console.log(`Player ${playerId} attempting to ${mode} room ${roomId}`);

            // Register Connection
            const existingSocket = RoomManager.getSocketForPlayer(playerId);
            RoomManager.addConnection(socket, playerId, roomId);

            if (existingSocket && existingSocket !== socket) {
                console.log(`Closing existing socket for ${playerId}`);
                existingSocket.close(1000, 'Replaced by new connection');
            }

            let roomState = await loadGameState(roomId) as RoomState | null;

            // Handle CREATE logic via Reducer or Initial Setup
            if (!roomState) {
                if (mode !== 'create') {
                    socket.close(1008, 'Room not found');
                    return;
                }

                // Initialize Room State (Platform Level)
                roomState = {
                    id: roomId,
                    phase: PlatformPhase.JOIN, // Start in JOIN/LOBBY
                    players: [],
                    gameVotes: {},
                    ownerId: playerId,
                    createdAt: Date.now()
                };

                // Use Reducer to "Join" the host
                // Actually first we save it so it exists
                await saveGameState(roomId, roomState);
            }

            // Ensure roomState is valid before proceeding
            if (!roomState) {
                socket.close(1008, 'Room state not found');
                return;
            }

            // Now dispatch JOIN_ROOM
            const joinAction: PlatformAction = {
                type: 'JOIN_ROOM',
                roomId,
                playerId,
                avatarId
            };

            const result = platformReducer(roomState, joinAction);
            if (result.events.some(e => e.type === 'ERROR')) {
                const error = result.events.find(e => e.type === 'ERROR');
                socket.close(1008, error?.message || 'Join Failed');
                return;
            }

            roomState = result.state;
            await saveGameState(roomId, roomState);

            // Broadcast State
            this.broadcastState(roomId, roomState);


            // Setup Message Handler
            socket.on('message', async (data: string) => {
                try {
                    const message = JSON.parse(data.toString()) as ClientMessage;

                    if (message.type === 'ACTION') {
                        // Map Client Actions to Platform Actions
                        let platformAction: PlatformAction | null = null;

                        // Handle Special "Global" actions that might be sent by Client 
                        // Client currently sends SH Action { type: 'START_GAME' }
                        if (message.action.type === 'START_GAME') {
                            platformAction = {
                                type: 'START_GAME',
                                roomId,
                                playerId: playerId! // Asserted
                            };
                        } else if (message.action.type === 'CLOSE_ROOM') {
                            // Not fully implemented in platform reducer yet, handled manually below or add to reducer
                            // Let's keep manual owner check for safety similar to before or add LEAVE_ROOM/CLOSE
                            // Legacy handled it in SocketServer. Let's defer "Close Room" to future Phase or handle via LEAVE?
                            // For now, ignore or implement basic close?
                            // User requirement: "Active usage JOIN -> LOBBY -> IN_GAME"
                            // If user closes room... let's stick to simple game actions.
                            // If it's a game action:
                            platformAction = {
                                type: 'GAME_ACTION',
                                roomId,
                                playerId: playerId!,
                                action: message.action
                            };
                        } else {
                            // Default Game Action
                            platformAction = {
                                type: 'GAME_ACTION',
                                roomId,
                                playerId: playerId!,
                                action: message.action
                            };
                        }

                        if (platformAction) {
                            // Load latest state
                            const currentState = await loadGameState(roomId) as RoomState;
                            if (!currentState) return;

                            const res = platformReducer(currentState, platformAction);

                            // Handle Errors
                            const err = res.events.find(e => e.type === 'ERROR');
                            if (err) {
                                // Send error to user?
                                // Socket doesn't have standard error message type in ClientMessage?
                                // Client expects specific events.
                                // If SH Engine error, it returns event { type: 'ERROR' }.
                                // Platform reducer returns PlatformEvent.
                                // We might need to map platform error to something client understands if it expects GameEvent.
                                // For now log it.
                                console.warn('Action Error:', err.message);
                                return;
                            }

                            // Save
                            await saveGameState(roomId, res.state);

                            // Broadcast
                            this.broadcastState(roomId, res.state);
                        }
                    }
                } catch (err) {
                    console.error('Error processing message', err);
                }
            });

            socket.on('close', async () => {
                console.log(`Player ${playerId} disconnected from ${roomId}`);
                RoomManager.removeConnection(socket);

                // Handle Leave
                try {
                    const state = await loadGameState(roomId) as RoomState | null;
                    if (state && state.phase !== PlatformPhase.IN_GAME) { // Only remove in Lobby?
                        // Platform Reducer LEAVE_ROOM
                        const leaveAction: PlatformAction = { type: 'LEAVE_ROOM', roomId, playerId: playerId! };
                        const res = platformReducer(state, leaveAction);

                        // Special check: If room empty, maybe delete? 
                        if (res.state.players.length === 0) {
                            // Clear room?
                            // saveGameState(roomId, null); // If we supported deletion
                        } else {
                            await saveGameState(roomId, res.state);
                            this.broadcastState(roomId, res.state);
                        }
                    }
                } catch (err) {
                    console.error("Error managing disconnection:", err);
                }
            });

            socket.on('error', (err) => {
                console.error(`Socket error for ${playerId}:`, err);
            });

        } catch (err) {
            console.error('Connection handling error', err);
            socket.close(1011, 'Internal Error');
        }
    }

    private broadcastState(roomId: string, state: RoomState) {
        const sockets = RoomManager.getSocketsInRoom(roomId);

        // [PHASE 2] Send raw RoomState to client
        // Client must now be able to handle RoomState

        for (const s of sockets) {
            if (s.readyState === WebSocket.OPEN) {
                const conn = RoomManager.getConnection(s);
                if (conn) {
                    // We still want some privacy, but for Platform State (Lobby), most info is public.
                    // If activeGame exists, we might need to sanitize THAT.
                    // But for now, let's just send full state or implement basic sanitization.

                    // Ideally: sanitizeRoomState(state, conn.playerId)
                    // For now, raw state.
                    s.send(JSON.stringify({ type: 'STATE_SYNC', state: state }));
                }
            }
        }
    }

    public close() {
        this.wss.close();
        this.httpServer.close();
    }
}

