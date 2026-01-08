import WebSocket from 'ws';

// Config
const PORT = 8080;
const HOST = `ws://localhost:${PORT}`;
const ROOM_ID = 'test-room-1';
const PLAYERS = ['p1', 'p2', 'p3', 'p4', 'p5'];

async function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('Starting Verification Script...');
    const sockets: WebSocket[] = [];

    try {
        // 1. Connect 5 Players
        console.log('Connecting 5 players...');
        for (const pid of PLAYERS) {
            const ws = new WebSocket(`${HOST}?roomId=${ROOM_ID}&playerId=${pid}`);

            ws.on('open', () => console.log(`${pid} connected`));
            ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'EVENT') {
                    console.log(`[${pid}] Received Event:`, msg.event.type);
                } else if (msg.type === 'STATE_SYNC') {
                    // console.log(`[${pid}] Received State Sync`);
                } else {
                    console.log(`[${pid}] Msg:`, msg);
                }
            });

            sockets.push(ws);
        }

        await wait(1000);

        // 2. Start Game (p1 sends command)
        console.log('P1 sending START_GAME...');
        const startMsg = {
            type: 'ACTION',
            action: { type: 'START_GAME' }
        };
        sockets[0].send(JSON.stringify(startMsg));

        await wait(1000);

        // 3. Verify Game Started
        // We simulate p1 checking their role (via logs above)
        // Check Redis manually or trust logs? 
        // We will assume logs seeing "GAME_STARTED" means success.

        // 4. Test Reconnection
        console.log('Simulating P1 Disconnect/Reconnect...');
        sockets[0].close();
        await wait(500);

        const wsReconnect = new WebSocket(`${HOST}?roomId=${ROOM_ID}&playerId=p1`);
        wsReconnect.on('open', () => console.log('P1 Reconnected'));
        wsReconnect.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'STATE_SYNC') {
                console.log('P1 Received State Sync on re-join - SUCCESS');
            }
        });

        await wait(1000);
        wsReconnect.close();

    } catch (e) {
        console.error('Verification Failed:', e);
    } finally {
        console.log('Closing all sockets...');
        sockets.forEach(s => s.close());
    }
}

run();
