import { connectRedis, disconnectRedis } from './redisStore';
import { SocketServer } from './socketServer';

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
