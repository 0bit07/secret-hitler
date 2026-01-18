
import { v4 as uuidv4 } from 'uuid';

interface Session {
    token: string;
    playerId: string;
    roomId: string;
    createdAt: number;
}

export class SessionManager {
    private static sessions: Map<string, Session> = new Map();
    private static playerTokens: Map<string, string> = new Map(); // playerId -> token (for easy lookup if needed)

    static createSession(playerId: string, roomId: string): string {
        // In Phase 1, we might want to allow reconnects to the same session?
        // For now, generate a new token or return existing if valid?
        // Let's generate new for simplicity, or look up?
        // User said: "Map token -> playerId + roomCode"

        const token = uuidv4();
        const session: Session = {
            token,
            playerId,
            roomId,
            createdAt: Date.now()
        };

        this.sessions.set(token, session);
        this.playerTokens.set(playerId, token);
        return token;
    }

    static getSession(token: string): Session | undefined {
        return this.sessions.get(token);
    }

    static validateSession(token: string): boolean {
        return this.sessions.has(token);
    }

    static removeSession(token: string) {
        const session = this.sessions.get(token);
        if (session) {
            this.playerTokens.delete(session.playerId);
            this.sessions.delete(token);
        }
    }
}
