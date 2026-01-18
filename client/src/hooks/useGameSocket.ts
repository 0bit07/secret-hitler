import { useRef, useState, useCallback } from 'react';
import { ServerMessage, Action, RoomState, PlatformAction } from '../types';

interface UseGameSocketReturn {
    isConnected: boolean;
    roomState: RoomState | null;
    sendAction: (action: Action | PlatformAction) => void;
    lastError: string | null;
    connect: (roomId: string, playerId: string, avatarId: string, mode?: 'create' | 'join') => void;
}

export const useGameSocket = (): UseGameSocketReturn => {
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);

    // Connection parameters
    const [connectionParams, setConnectionParams] = useState<{ roomId: string, playerId: string } | null>(null);

    const connect = useCallback((roomId: string, playerId: string, avatarId: string, mode: 'create' | 'join' = 'join') => {
        if (socketRef.current) {
            socketRef.current.close();
        }

        // Store connection params for sendAction, even if connection is handled directly here
        setConnectionParams({ roomId, playerId });

        // Use local env if available, else production default (but we fixed .env.local)
        const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
        const url = `${WS_URL}?roomId=${roomId}&playerId=${playerId}&avatarId=${avatarId}&mode=${mode}`;

        console.log(`Connecting to ${url}...`);
        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('WS Connected');
            setIsConnected(true);
            setLastError(null);
        };

        ws.onclose = (event) => {
            console.log('WS Disconnected', { code: event.code, reason: event.reason });
            setIsConnected(false);
            if (event.code === 1008) {
                setLastError(event.reason || 'Connection rejected');
                setRoomState(null); // Ensure loading state is cleared effectively
            } else if (event.code === 1000) {
                // Normal closure
            } else {
                // Other errors
            }
        };

        ws.onerror = (err) => {
            console.error('WS Error', err);
            setLastError('Connection Error');
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data) as ServerMessage;

                if (msg.type === 'STATE_SYNC') {
                    // Update RoomState
                    setRoomState(msg.state as RoomState);
                } else if (msg.type === 'EVENT') {
                    if (msg.event.type === 'ROOM_CLOSED') {
                        setLastError('Room closed by host.');
                        ws.close();
                        setRoomState(null);
                        setIsConnected(false);
                    }
                    console.log('Game Event:', msg.event);
                    // In Phase B, we would trigger animations here
                } else if (msg.type === 'ERROR') {
                    console.error('Server Error:', msg.message);
                    setLastError(msg.message);
                }
            } catch (e) {
                console.error('Failed to parse message', e);
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    const sendAction = useCallback((action: Action | PlatformAction) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && connectionParams) {
            const payload = {
                type: 'ACTION',
                roomId: connectionParams.roomId,
                playerId: connectionParams.playerId,
                action
            };
            socketRef.current.send(JSON.stringify(payload));
        } else {
            console.warn('Cannot send action: Socket not connected');
        }
    }, [connectionParams]);

    return { isConnected, roomState, sendAction, lastError, connect };
};
