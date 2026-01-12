import { WebSocketServer, WebSocket } from 'ws';
import http, { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { RoomManager } from './roomManager';
import { ActionHandler } from './actionHandler';
import { loadGameState, saveGameState } from './redisStore';
import { sanitizeStateForPlayer } from '../engine/utils/privacy';
import { createLobbyState } from '../engine/initializer';
import { ClientMessage, ServerMessage } from './types';


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
            // Parse query params for simple auth/room selection
            // Use a hardcoded base URL for parsing req.url to avoid dependency on headers.host
            const url = new URL(req.url || '', 'http://localhost');
            const roomId = url.searchParams.get('roomId');
            const playerId = url.searchParams.get('playerId');

            if (!roomId || !playerId) {
                socket.close(1008, 'Missing roomId or playerId');
                return;
            }

            console.log(`Player ${playerId} joined room ${roomId}`);

            // 🔥 DEBUG: Prove server → client messaging works
            socket.send(JSON.stringify({
                type: "EVENT",
                event: { kind: "DEBUG", message: "Hello from server after connect" }
            }));


            // 1. Register Connection
            RoomManager.addConnection(socket, playerId, roomId);

            // 2. Handle Reconnection / Initial State
            // If game exists, send state immediately
            const currentState = await loadGameState(roomId);
            if (currentState) {
                const sanitized = sanitizeStateForPlayer(currentState, playerId);
                const syncMsg: ServerMessage = { type: 'STATE_SYNC', state: sanitized };
                socket.send(JSON.stringify(syncMsg));
            } else {
                // No state exists (New Room). Initialize Lobby.
                console.log(`Initializing new room ${roomId} with owner ${playerId}`);

                const newState = createLobbyState(playerId); // First player is owner
                await saveGameState(roomId, newState);

                // Send initial state
                const sanitized = sanitizeStateForPlayer(newState, playerId);
                socket.send(JSON.stringify({ type: 'STATE_SYNC', state: sanitized }));
            }

            // 3. Setup message handler
            socket.on('message', async (data: string) => {
                try {
                    const message = JSON.parse(data.toString()) as ClientMessage;

                    // Basic router based on type
                    if (message.type === 'ACTION') {
                        // Enforce consistency between socket auth and message payload
                        // The message structure has `playerId`, but we should trust the socket connection mapping
                        // In a strict server, we'd override message.playerId with the trusted connection.playerId
                        message.playerId = playerId;
                        message.roomId = roomId;

                        await ActionHandler.handleAction(message);
                    }
                } catch (err) {
                    console.error('Error processing message', err);
                    socket.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message format' }));
                }
            });

            // 4. Setup close handler
            socket.on('close', () => {
                console.log(`Player ${playerId} disconnected from ${roomId}`);
                RoomManager.removeConnection(socket);
                // Note: We do NOT remove the player from the GameState (no auto-kick)
            });

            socket.on('error', (err) => {
                console.error(`Socket error for ${playerId}:`, err);
            });

        } catch (err) {
            console.error('Connection handling error', err);
            socket.close(1011, 'Internal Error');
        }
    }

    public close() {
        this.wss.close();
        this.httpServer.close();
    }
}
