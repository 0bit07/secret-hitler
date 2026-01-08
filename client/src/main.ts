import './style.css' // Optional if vite generated it, otherwise ignore
// We don't have style.css, but index.html has inline styles.

// Types
type LogType = 'EVENT' | 'STATE_SYNC' | 'ERROR' | 'INFO';

interface ServerMessage {
    type: 'EVENT' | 'STATE_SYNC' | 'ERROR';
    event?: any;
    state?: any;
    message?: string;
}

// DOM Elements
const roomIdInput = document.getElementById('roomId') as HTMLInputElement;
const playerIdInput = document.getElementById('playerId') as HTMLInputElement;
const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement;
const disconnectBtn = document.getElementById('disconnectBtn') as HTMLButtonElement;
const statusSpan = document.getElementById('connection-status') as HTMLElement;
const logsDiv = document.getElementById('logs') as HTMLElement;
const statePre = document.getElementById('state-display') as HTMLElement;
const nomineeInput = document.getElementById('nomineeId') as HTMLInputElement;
const nominateBtn = document.getElementById('nominateBtn') as HTMLButtonElement;
const sendJsonBtn = document.getElementById('sendJsonBtn') as HTMLButtonElement;
const jsonActionInput = document.getElementById('jsonAction') as HTMLTextAreaElement;

let socket: WebSocket | null = null;
let currentRoomId = '';
let currentPlayerId = '';

function log(type: LogType, content: any) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type === 'ERROR' ? 'log-error' : ''}`;

    const time = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    const timestamp = document.createElement('span');
    timestamp.className = 'log-time';
    timestamp.textContent = `[${time}]`;

    const typeSpan = document.createElement('span');
    typeSpan.className = 'log-type';
    typeSpan.textContent = type;

    const contentSpan = document.createElement('span');
    if (typeof content === 'string') {
        contentSpan.textContent = content;
    } else {
        contentSpan.textContent = JSON.stringify(content);
    }

    entry.appendChild(timestamp);
    entry.appendChild(typeSpan);
    entry.appendChild(contentSpan);

    logsDiv.prepend(entry); // Newest first
}

function updateState(state: any) {
    statePre.textContent = JSON.stringify(state, null, 2);
    // highlight unknown roles or sensitive info if present (should verify privacy)
}

function connect() {
    if (socket) {
        socket.close();
    }

    currentRoomId = roomIdInput.value;
    currentPlayerId = playerIdInput.value;

    const WS_URL = import.meta.env.VITE_WS_URL;
    if (!WS_URL) {
        log('ERROR', 'VITE_WS_URL is not defined');
        return;
    }

    const url = `${WS_URL}?roomId=${currentRoomId}&playerId=${currentPlayerId}`;
    log('INFO', `Connecting to ${url}...`);

    socket = new WebSocket(url);

    socket.onopen = () => {
        statusSpan.textContent = 'Connected';
        statusSpan.className = 'connected';
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        log('INFO', 'WebSocket Connected');
    };

    socket.onclose = () => {
        statusSpan.textContent = 'Disconnected';
        statusSpan.className = 'disconnected';
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
        log('INFO', 'WebSocket Disconnected');
        socket = null;
    };

    socket.onerror = (err) => {
        log('ERROR', 'WebSocket Error');
        console.error(err);
    };

    socket.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data) as ServerMessage;

            if (msg.type === 'EVENT') {
                log('EVENT', msg.event);
            } else if (msg.type === 'STATE_SYNC') {
                log('STATE_SYNC', 'Received State Update');
                updateState(msg.state);
            } else if (msg.type === 'ERROR') {
                log('ERROR', msg.message || 'Unknown Server Error');
            } else {
                log('INFO', `Unknown Message: ${JSON.stringify(msg)}`);
            }
        } catch {
            log('ERROR', `Failed to parse message: ${event.data}`);
        }
    };
}

function sendAction(action: any) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        log('ERROR', 'Cannot send: disconnected');
        return;
    }

    const payload = {
        type: 'ACTION',
        roomId: currentRoomId,
        playerId: currentPlayerId,
        action: action
    };

    socket.send(JSON.stringify(payload));
    log('INFO', `Sent Action: ${action.type}`);
}

// Event Listeners
connectBtn.addEventListener('click', connect);
disconnectBtn.addEventListener('click', () => socket?.close());

// Generalized Action Buttons
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const action = JSON.parse((e.target as HTMLElement).dataset.action!);
        // Inject playerId if needed, but wrapper handles it
        // Some actions need extra data from inputs?
        // Simple buttons are fine.
        // CAST_VOTE needs vote.
        // The data-action should have it.
        // We need to inject playerId into action payload? No, Protocol says action is `EngineAction`. 
        // EngineAction usually needs playerId.
        // Let's modify the payload helper to inject `playerId` into the `action` object itself 
        // because most Engine Actions (like CAST_VOTE) require `playerId` in the action body too.

        // Protocol:
        // Client -> { type: ACTION, roomId, playerId, action: { type, playerId, ... } }
        // We supply outer `playerId`.
        // Server ActionHandler does: `await ActionHandler.handleAction(playerId, message);`
        // But the internal `action` object also usually expects `playerId`.
        // Let's autofill it.
        const fullAction = { ...action, playerId: currentPlayerId };
        sendAction(fullAction);
    });
});

nominateBtn.addEventListener('click', () => {
    if (!nomineeInput.value) {
        log('ERROR', 'Nominee ID required');
        return;
    }
    const action = {
        type: 'NOMINATE_CHANCELLOR',
        playerId: currentPlayerId,
        chancellorId: nomineeInput.value
    };
    sendAction(action);
});

sendJsonBtn.addEventListener('click', () => {
    try {
        const customAction = JSON.parse(jsonActionInput.value);
        // Autofill playerId if missing
        if (!customAction.playerId) {
            customAction.playerId = currentPlayerId;
        }
        sendAction(customAction);
    } catch (e) {
        log('ERROR', 'Invalid JSON in manual action input');
    }
});
