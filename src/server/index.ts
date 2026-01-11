import 'dotenv/config';
import { connectRedis, disconnectRedis } from './redisStore';
import { SocketServer } from './socketServer';

// Global Crash Handlers
process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', err);
    // Optional: process.exit(1) if you want to force restart immediately, 
    // but Railway/Docker often handles this better if we just log and let it die naturally or via future checks.
    // For now, let's log it prominently.
});

process.on('unhandledRejection', (reason) => {
    console.error('🔥 UNHANDLED PROMISE REJECTION:', reason);
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

async function bootstrap() {
    try {
        console.log('Starting Secret Hitler Orchestration Layer...');

        // 1. Connect to Redis (Stateless store)
        await connectRedis();

        // 2. Start WebSocket Server
        const server = new SocketServer(PORT);

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received. Shutting down...');
            server.close();
            await disconnectRedis();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            console.log('SIGINT received. Shutting down...');
            server.close();
            await disconnectRedis();
            process.exit(0);
        });

    } catch (err) {
        console.error('Fatal startup error:', err);
        process.exit(1);
    }
}

bootstrap();
