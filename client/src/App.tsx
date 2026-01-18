import { useState, useEffect, useMemo } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { GameLayout } from './ui/layout/GameLayout';
import { LobbyScreen } from './ui/screens/LobbyScreen';
import { Phase, PlatformPhase, SecretHitlerGameState } from './types';
import { ActionButton } from './ui/components/ActionButton';
import { RoleRevealScreen } from './ui/screens/RoleRevealScreen';
import { AvatarSelection } from './ui/components/AvatarSelection';
import { AvatarSelectionScreen } from './ui/screens/AvatarSelectionScreen';
import { GameVotingScreen } from './ui/screens/GameVotingScreen';

function App() {
    const { isConnected, roomState, sendAction, connect, lastError } = useGameSocket();
    const [hasJoined, setHasJoined] = useState(false);
    const [view, setView] = useState<'menu' | 'avatar' | 'join' | 'create'>('menu');
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('avatar-01');

    // Adapter: Map Platform RoomState to SecretHitlerGameState for existing UI
    const gameState = useMemo<SecretHitlerGameState | null>(() => {
        if (!roomState) return null;

        if (roomState.phase === PlatformPhase.IN_GAME && roomState.activeGame) {
            return roomState.activeGame.gameState;
        }

        // For other phases, we return null or handle explicitly in renderScreen
        return null;
    }, [roomState]);

    // Auto-connect if URL params exist
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const r = params.get('roomId');
        const p = params.get('playerId');
        const m = params.get('mode'); // 'create' or 'join'
        const a = params.get('avatarId'); // If reloading, might want this

        if (r && p && !isConnected && !hasJoined) {
            setRoomId(r);
            setUsername(p);
            // If reloading a game in progress, avatar might be lost if we don't save it.
            // But server has it in RoomState. We just need to reconnect.
            // Using default 'avatar-01' is fine for reconnect, server won't override existing avatar if we don't send SELECT_AVATAR ?
            // Actually connect sends avatarId.
            // Ideally we persist this in localStorage or URL.
            const avatarToUse = a || 'avatar-01';
            connect(r, p, avatarToUse, (m as 'create' | 'join') || 'join');
            setHasJoined(true);
        }
    }, [connect, isConnected, hasJoined]);

    const renderScreen = () => {
        if (!roomState) {
            return (
                <div className="flex flex-col items-center justify-center space-y-4 mt-20 animate-fade-in">
                    <div className="text-white text-xl animate-pulse">
                        {lastError ? 'Connection Terminated' : 'Loading Game State...'}
                    </div>
                    {lastError && (
                        <div className="text-red-400 bg-red-900/30 p-4 rounded border border-red-500/50 max-w-md text-center">
                            {lastError}
                        </div>
                    )}
                    <ActionButton
                        label="RETURN TO MENU"
                        onClick={() => {
                            setHasJoined(false);
                            setRoomId('');
                            setUsername('');
                            // Clear URL params
                            window.history.pushState({}, '', window.location.pathname);
                            // Force reload to clear socket state completely if needed, or just relying on React state
                            window.location.reload();
                        }}
                        variant="neutral"
                        className="w-48"
                    />
                </div>
            );
        }

        switch (roomState.phase) {
            case PlatformPhase.JOIN:
                // Likely transient, or showing a "Joining..." spinner if separate from Menu
                return <div className="text-white text-xl animate-pulse">Joining Room...</div>;

            case PlatformPhase.AVATAR_SELECT:
                return (
                    <AvatarSelectionScreen
                        roomId={roomId}
                        currentAvatarId={roomState.players.find(p => p.id === username)?.avatarId || 'avatar-01'}
                        onSelectAvatar={(avatarId) => sendAction({
                            type: 'SELECT_AVATAR',
                            roomId,
                            playerId: username,
                            avatarId
                        })}
                    />
                );

            case PlatformPhase.GAME_VOTE:
                return (
                    <GameVotingScreen
                        roomId={roomId}
                        players={roomState.players}
                        gameVotes={roomState.gameVotes}
                        currentPlayerId={username}
                        onVote={(gameId) => sendAction({
                            type: 'VOTE_GAME',
                            roomId,
                            playerId: username,
                            gameId
                        })}
                    />
                );

            case PlatformPhase.LOBBY:
            case PlatformPhase.GAME_SELECT:
            case PlatformPhase.READY:
                // We use LobbyScreen for LOBBY and others generally
                return (
                    <LobbyScreen
                        roomId={roomId || roomState.id}
                        players={roomState.players}
                        ownerId={roomState.ownerId}
                        currentPlayerId={username}
                        onStartGame={() => sendAction({ type: 'START_GAME', playerId: username, playerIds: [] as any })}
                        onCloseRoom={() => sendAction({ type: 'CLOSE_ROOM', playerId: username })}
                    />
                );
            case PlatformPhase.IN_GAME:
                if (!gameState) return <div className="text-red-500">Error: Game State Missing</div>;

                // Now switch on GAME phase
                switch (gameState.phase) {
                    case Phase.LOBBY: // Game specific lobby (should likely be skipped if Platform handles it)
                        // If we are IN_GAME but game is in LOBBY, it means engine is initialized.
                        // We can show LobbyScreen here too, but passing GameState.players
                        // But wait, our LobbyScreen now takes PlatformPlayer.
                        // We should probably rely on the Platform Phase staying in LOBBY until game really starts?
                        // Or if IN_GAME + LOBBY, we might want to just show the Board or similar.
                        // Actually, engine LOBBY phase might be redundant now.
                        return (
                            <LobbyScreen
                                roomId={roomId}
                                players={roomState.players} // Use platform players even here?
                                ownerId={roomState.ownerId}
                                currentPlayerId={username}
                                onStartGame={() => sendAction({ type: 'START_GAME', playerId: username, playerIds: [] as any })}
                                onCloseRoom={() => sendAction({ type: 'CLOSE_ROOM', playerId: username })}
                            />
                        );
                    case Phase.ROLE_REVEAL:
                        return (
                            <RoleRevealScreen
                                gameState={gameState}
                                currentPlayerId={username}
                                onAcknowledge={() => sendAction({ type: 'ACKNOWLEDGE_ROLE', playerId: username })}
                            />
                        );
                    case Phase.NOMINATION:
                        return <div className="text-white text-2xl">Nomination (Coming Soon)</div>;
                    case Phase.VOTING:
                        return <div className="text-white text-2xl">Voting (Coming Soon)</div>;
                    case Phase.LEGISLATION:
                    case Phase.LEGISLATIVE_PRESIDENT:
                    case Phase.LEGISLATIVE_CHANCELLOR:
                        return <div className="text-white text-2xl">Legislation (Coming Soon)</div>;
                    case Phase.EXECUTIVE_ACTION:
                        return <div className="text-white text-2xl">Executive Action (Coming Soon)</div>;
                    case Phase.GAME_OVER:
                        return <div className="text-white text-2xl">Game Over (Coming Soon)</div>;
                    default:
                        // Convert Phase enum to string for display or simple fallback
                        return <div className="text-red-500">Unknown Game Phase: {gameState.phase}</div>;
                }
            case PlatformPhase.GAME_OVER:
                return <div className="text-white text-2xl">Room Closed / Game Over</div>;
            default:
                return <div className="text-red-500">Unknown Platform Phase: {roomState.phase}</div>;
        }
    };

    // Generate 4-char random code
    const generateRoomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleCreateGame = () => {
        if (!username) return;
        const newRoomId = generateRoomCode();
        setRoomId(newRoomId);
        connect(newRoomId, username, selectedAvatar, 'create');
        setHasJoined(true);
        window.history.pushState({}, '', `?roomId=${newRoomId}&playerId=${username}`);
    };

    const handleJoinGame = () => {
        if (!roomId || !username) return;
        connect(roomId.toUpperCase(), username, selectedAvatar, 'join');
        setHasJoined(true);
        window.history.pushState({}, '', `?roomId=${roomId}&playerId=${username}`);
    };

    if (!hasJoined) {
        return (
            <GameLayout>
                <div className="flex flex-col items-center space-y-6 w-full max-w-md">
                    <h1 className="text-5xl font-bold text-white mb-4 tracking-widest drop-shadow-lg">SECRET HITLER</h1>

                    {/* Main Menu View - Username */}
                    {view === 'menu' && (
                        <div className="flex flex-col space-y-4 w-full px-8 animate-fade-in">
                            <h2 className="text-xl text-gray-300 text-center uppercase tracking-widest">Identify Yourself</h2>
                            <input
                                type="text"
                                placeholder="ENTER CODENAME"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="px-4 py-3 rounded text-white bg-gray-800 border-2 border-gray-600 focus:border-red-500 outline-none text-center text-xl font-bold uppercase tracking-wider placeholder-gray-500"
                                maxLength={12}
                            />

                            <ActionButton
                                label="CONTINUE"
                                onClick={() => setView('avatar')}
                                disabled={!username}
                                className="w-full"
                            />
                        </div>
                    )}

                    {/* Avatar Selection View */}
                    {view === 'avatar' && (
                        <div className="flex flex-col space-y-4 w-full px-4 animate-fade-in items-center">
                            <h2 className="text-xl text-gray-300 text-center uppercase tracking-widest">Select Disguise</h2>

                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                <AvatarSelection
                                    selectedAvatar={selectedAvatar}
                                    onSelect={setSelectedAvatar}
                                />
                            </div>

                            <div className="flex gap-4 w-full px-4">
                                <ActionButton
                                    label="BACK"
                                    onClick={() => setView('menu')}
                                    variant="neutral"
                                    className="flex-1"
                                />
                                <ActionButton
                                    label="CONFIRM"
                                    onClick={() => setView('create')}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    )}

                    {/* Choice View (Reusing create/join logic but clearer separation?) 
                        Wait, previously I had Create/Join buttons.
                        Now View 'create' is "Create Room" input (which is auto-generated usually, but displayed).
                        And View 'join' is "Enter Code".
                        I need a view to CHOOSE between Create and Join.
                        In my previous broken edit, I replaced the choice buttons with the username input.
                        Let's fix the flow:
                        1. Menu: Username -> Continue
                        2. Avatar: Select -> Confirm
                        3. Choice: Create or Join Buttons
                        4. Create: Show Room Code & "Entering..."
                        5. Join: Enter Room Code
                    */}

                    {/* Let's simplify and make 'create' view show the choice buttons if we treat it as 'lobby_choice'? 
                        Or just add a 'choice' view.
                        I'll use the 'create' view state as the Choice screen for now to match the "CONFIRM" button above leading to 'create'.
                        Wait, 'create' view in my previous code was "Create New Room" confirmation.
                        Let's check the old code...
                        Old code: 
                        Main Menu had username input AND buttons.
                        
                        New flow:
                        1. Username (Menu)
                        2. Avatar (Avatar)
                        3. Choice (Create/Join buttons)
                        4. Create Impl
                        5. Join Impl
                    */}

                    {/* Let's rename 'create' to 'choice' in the state? No, that breaks TS state unless I update generic. 
                        Let's just update the views to:
                        menu -> avatar -> choice -> join / create_confirm
                        
                        I will stick to the previous file's structure but CLEAN it up.
                        My state is: <'menu' | 'avatar' | 'join' | 'create'>
                        
                        'menu': Username Input. NEXT -> 'avatar'
                        'avatar': Avatar Grid. NEXT -> ? We need a Choice screen.
                        
                        I'll repurpose 'menu' to be just Username.
                        I'll use 'create' (confusing name) to mean "Choice Screen"? No, that's bad.
                        I'll ADD 'choice' to the type.
                    */}

                    {/* Wait, I can't easily change the type in `write_to_file` without ensuring I catch all usages.
                        Let's just look at what I have in this `write_to_file`:
                        `const [view, setView] = useState<'menu' | 'avatar' | 'join' | 'create'>('menu');`
                        
                        I will USE:
                        'menu': Username
                        'avatar': Avatar
                        'create': The CHOICE screen (Create vs Join button) - hacky naming but works without changing types elsewhere if any.
                        'join': The JOIN input screen.
                        
                        But wait, where is the "Create Room" confirmation? 
                        Previously 'create' was the confirmation "You will be host...".
                        
                        If I make 'create' the choice screen, where does "Create Room" go?
                        Directly handle create? Or maybe reusing 'join' for both? No.
                        
                        Okay, let's fix the State Type properly.
                    */}

                    {/* Choice View (using 'create' state as the Choice Hub for now to save refactor, or just add 'choice') */}
                    {view === 'create' && (
                        <div className="flex flex-col space-y-4 w-full px-8 animate-fade-in">
                            <h2 className="text-2xl text-gray-300 text-center font-bold">MISSION SELECT</h2>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <button
                                    onClick={handleCreateGame} // Direct create for now? Or show confirmation?
                                    // Let's just create directly for smooth UX? 
                                    // User usually wants to confirm.
                                    // Let's make a new 'host_confirm' state? 
                                    // Actually, I can just use a boolean "showCreateConfirm" or something.
                                    // But let's stick to the simplest valid flow.
                                    // Let's add 'choice' to the type in this file. It replaces the old file completely.
                                    className="p-6 rounded-xl border-2 border-gray-600 bg-gray-800 hover:border-red-500 hover:bg-gray-700 cursor-pointer flex flex-col items-center gap-2 transition-all"
                                >
                                    <span className="text-3xl">👑</span>
                                    <span className="font-bold text-white">CREATE ROOM</span>
                                </button>
                                <button
                                    onClick={() => setView('join')}
                                    className="p-6 rounded-xl border-2 border-gray-600 bg-gray-800 hover:border-blue-500 hover:bg-gray-700 cursor-pointer flex flex-col items-center gap-2 transition-all"
                                >
                                    <span className="text-3xl">🔍</span>
                                    <span className="font-bold text-white">JOIN ROOM</span>
                                </button>
                            </div>
                            <ActionButton
                                label="BACK"
                                onClick={() => setView('avatar')}
                                variant="neutral"
                                className="mt-4"
                            />
                        </div>
                    )}

                    {view === 'join' && (
                        <div className="flex flex-col space-y-4 w-full px-8 animate-fade-in">
                            <h2 className="text-2xl text-gray-300 text-center font-bold">JOIN EXISTING ROOM</h2>
                            <div className="text-center text-gray-400 mb-4">Playing as <span className="text-white font-bold">{username}</span></div>

                            <input
                                type="text"
                                placeholder="ROOM CODE (4-CHAR)"
                                value={roomId}
                                maxLength={4}
                                onChange={e => setRoomId(e.target.value.toUpperCase())}
                                className="px-4 py-4 rounded text-white bg-gray-800 border-2 border-gray-600 focus:border-blue-500 outline-none text-center text-3xl font-mono uppercase tracking-[0.5em]"
                            />

                            <div className="flex gap-4">
                                <ActionButton
                                    label="BACK"
                                    onClick={() => setView('create')} // Back to Choice
                                    variant="neutral"
                                    className="flex-1"
                                />
                                <ActionButton
                                    label="JOIN"
                                    onClick={handleJoinGame}
                                    disabled={roomId.length < 4}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    )}

                    {lastError && <div className="text-red-400 bg-red-900/30 border border-red-900/50 p-3 rounded text-center text-sm font-bold w-full">{lastError}</div>}
                </div>
            </GameLayout>
        );
    }

    return (
        <GameLayout>
            {lastError && (
                <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-center py-1 text-xs">
                    {lastError}
                </div>
            )}
            {!isConnected && (
                <div className="absolute top-0 right-0 m-4 text-red-500 font-bold animate-pulse">
                    Disconnected
                </div>
            )}
            {isConnected && roomState && (
                <div className="absolute top-0 right-0 m-4 text-green-500 font-bold">
                    Connected
                </div>
            )}

            {renderScreen()}

            {/* Loading Overlay */}
            {hasJoined && !roomState && !lastError && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h2 className="text-2xl font-bold text-white tracking-widest">CONNECTING...</h2>
                        <p className="text-gray-400 mt-2">Establishing secure line to High Command</p>
                    </div>
                </div>
            )}
        </GameLayout>
    );
}

export default App;
