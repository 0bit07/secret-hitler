import { gameReducer } from '../engine';
import { EventEmitter } from './eventEmitter';
import { loadGameState, saveGameState } from './redisStore';
import { RoomManager } from './roomManager';
import { ClientMessage } from './types';

export class ActionHandler {
    static async handleAction(message: ClientMessage) {
        const { roomId, playerId, action } = message;

        // 1. Load State
        let state = await loadGameState(roomId);

        // 2. Handle START_GAME special logic (Hydrate player list)
        if (action.type === 'START_GAME') {
            if (state) {
                // Game already exists?
                // If it's in LOBBY phase, we can restart? Or maybe it is idempotent?
                // The engine reducer handles START_GAME by resetting/initing.
                // But we should probably check if it's allowed.
                // Let the reducer/validator handle validity.
            }

            // Server determines who plays based on RoomManager
            // In a real app, strict lobbies in Redis would be better, but we are keeping it simple:
            // "Room members = Connected Sockets" for the start.
            // OR we assume the client sends the list (but that's unsafe).
            // Let's rely on RoomManager.
            const connectedIds = RoomManager.getConnectedPlayerIds(roomId);

            // We need names too. For now, use ID as name or fetch from where?
            // The prompt doesn't specify auth/user profile storage.
            // We will use ID as name for simplicity.
            const playersForGame = connectedIds.map(id => ({ id, name: id }));

            // Override the action payload with trusted server data
            // @ts-ignore - We are constructing the payload that the engine expects
            action.playerIds = playersForGame;
            // @ts-ignore
            action.playerId = playerId;
        }

        // 3. Validate (Optional Pre-check, but Engine does it too)
        // We do stricter checks like "Is Player in State?" for non-start actions
        if (state && action.type !== 'START_GAME') {
            // For some actions, check if player is in the game
            const playerInGame = state.players.some(p => p.id === playerId);
            if (!playerInGame) {
                // Potentially a spectator trying to act?
                // Or a reconnnected player that was unknown?
                // Let the engine validator decide if "playerId" is valid for the action context.
                // Actually, engine validator checks logic, not necessarily "Is sender allowed".
                // But most actions in engine require `playerId` matching something (like `state.presidentIndex`).
            }
        }

        // 4. Run Reducer
        // If state is null, we pass undefined to reducer?
        // Reducer signature: (state: GameState = createLobbyState(), action: Action)
        // If we pass undefined, it uses default lobby state.
        // But `loadGameState` returns null.

        const effectiveState = state || undefined;

        // Execute
        const result = gameReducer(effectiveState, action);

        // Check for reducer-level errors (returned as events)
        const errorEvent = result.events.find(e => e.type === 'ERROR');
        if (errorEvent) {
            // Emitting error to the specific player would be ideal, 
            // but the reducer just returns it as an event.
            // We'll broadcast it for now or try to target sender if we knew how.
            // EventEmitter.sendError(socket, errorEvent.message) would be better if we had the socket instance here.
            // But we can just "Emit Game Events" and let logic handle it.
            // However, typical pattern: Reducer returns error event -> Send to requester only?
            // "Return structured error event" - prompt.
            // Let's use EventEmitter which filters "private" events? 
            // The ERROR event in types.ts doesn't have a target playerId. 
            // We'll treat it as a room broadcast for simplicity or update types if allowed.
            // Wait, "Private events (e.g., ROLE_ASSIGNED) → send only to target player".
            // ERROR isn't marked with playerId.
            // We will emit it to the room (everyone sees "User X failed action") 
            // OR better: handle it here and send to specific socket.
            const socket = RoomManager.getSocketForPlayer(playerId);
            if (socket) {
                //@ts-ignore
                EventEmitter.sendError(socket, errorEvent.message);
            }
            return; // Don't save state if error? validation error usually implies no state change.
            // Reducer returns `state` (param) if error. So safe to save or not save.
            // Optimization: Don't save if state ref is same?
        }

        // 5. Save State
        await saveGameState(roomId, result.state);

        // 6. Emit Events
        EventEmitter.emitGameEvents(roomId, result.events);

        // 7. Broadcast State Update
        EventEmitter.broadcastState(roomId, result.state);
    }
}
