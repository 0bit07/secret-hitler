import { createClient } from 'redis';
import { GameState } from '../engine/types';
import { mockRedisClient } from './mockRedisStore';

// Initialize Redis client
// Note: In a real app, URL would come from env vars
const useMock = process.env.USE_MOCK_REDIS === 'true';

// @ts-ignore
const redisClient = useMock
    ? mockRedisClient
    // @ts-ignore
    : createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

if (!useMock) {
    // @ts-ignore
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
}

let isConnected = false;

export async function connectRedis() {
    if (!isConnected) {
        // @ts-ignore
        await redisClient.connect();
        isConnected = true;
        console.log(`Connected to ${useMock ? 'Mock ' : ''}Redis`);
    }
}

export async function disconnectRedis() {
    if (isConnected) {
        // @ts-ignore
        await redisClient.quit();
        isConnected = false;
        console.log('Disconnected from Redis');
    }
}

const GAME_PREFIX = 'game:';
const GAME_TTL_SECONDS = 7200; // 2 hours

function getGameKey(roomId: string): string {
    return `${GAME_PREFIX}${roomId}`;
}

/**
 * Save game state to Redis with TTL
 */
export async function saveGameState(roomId: string, state: GameState): Promise<void> {
    const key = getGameKey(roomId);
    const serialized = JSON.stringify(state);

    // Save string and set expiry in one multi operation or simple pipeline
    if (useMock) {
        // @ts-ignore
        await redisClient.set(key, serialized);
    } else {
        // @ts-ignore
        await redisClient.set(key, serialized, {
            EX: GAME_TTL_SECONDS
        });
    }
}

/**
 * Load game state from Redis
 */
export async function loadGameState(roomId: string): Promise<GameState | null> {
    const key = getGameKey(roomId);
    // @ts-ignore
    const data = await redisClient.get(key);

    if (!data) return null;

    try {
        return JSON.parse(data) as GameState;
    } catch (e) {
        console.error(`Failed to parse game state for room ${roomId}`, e);
        return null;
    }
}

/**
 * Check if a game exists
 */
export async function gameExists(roomId: string): Promise<boolean> {
    const key = getGameKey(roomId);
    // @ts-ignore
    return (await redisClient.exists(key)) === 1;
}

// Export client for advanced usage if needed, but try to use wrappers
export { redisClient };
