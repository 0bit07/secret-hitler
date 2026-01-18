import React from 'react';
import { PlatformPlayer, Role } from '../../types';
import { PlayerList } from '../components/PlayerList';
import { ActionButton } from '../components/ActionButton';
import { PhaseHeader } from '../components/PhaseHeader';

interface LobbyScreenProps {
    roomId: string;
    players: PlatformPlayer[];
    ownerId: string;
    currentPlayerId: string;
    onStartGame: () => void;
    onCloseRoom: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ roomId, players, ownerId, currentPlayerId, onStartGame, onCloseRoom }) => {
    const isOwner = ownerId === currentPlayerId;
    const playerCount = players.length;
    const canStart = isOwner && playerCount >= 5 && playerCount <= 10;

    // Map PlatformPlayer to UI Player (Display Only)
    const displayPlayers = players.map(p => ({
        id: p.id,
        name: p.name,
        avatarId: p.avatarId,
        role: Role.LIBERAL, // Hidden in lobby
        party: 'liberal' as const,
        alive: true,
        isPresident: false,
        isChancellor: false,
        wasPresident: false,
        wasChancellor: false,
        hasSeenRole: false
    }));

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
            <PhaseHeader
                title="Lobby"
                subtitle={`Room Code: ${roomId}`}
            />

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-200">Waiting for Players...</h2>
                <p className="text-gray-400">
                    Current: {playerCount} / 10 (Min 5)
                </p>
            </div>

            {/* Player Grid */}
            <PlayerList
                players={displayPlayers}
                currentPlayerId={currentPlayerId}
                presidentIndex={-1}
                chancellorId={null}
                ownerId={ownerId}
            />

            {/* Actions */}
            <div className="mt-8">
                {isOwner ? (
                    <ActionButton
                        label={canStart ? "START GAME" : "Waiting for 5+ Players..."}
                        onClick={onStartGame}
                        disabled={!canStart}
                        variant={canStart ? 'success' : 'neutral'}
                        className="w-64 py-4 text-xl shadow-xl"
                    />
                ) : (
                    <div className="text-yellow-500 animate-pulse font-bold bg-gray-900/50 px-6 py-3 rounded-full border border-yellow-500/30">
                        Waiting for Host to Start...
                    </div>
                )}
            </div>

            {/* Owner: Close Room */}
            {isOwner && (
                <div className="mt-4">
                    <ActionButton
                        label="CLOSE ROOM"
                        onClick={() => {
                            if (confirm('Are you sure you want to close this room? Everyone will be disconnected.')) {
                                onCloseRoom();
                            }
                        }}
                        variant="danger"
                        className="w-48 py-2 text-sm opacity-50 hover:opacity-100"
                    />
                </div>
            )}

            {/* Rules / Hint */}
            <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/20 text-sm text-blue-200 text-center max-w-lg">
                <strong className="block mb-1 text-blue-100">How to Play:</strong>
                Secret Hitler is a game of social deduction. Find and stop the Secret Hitler before it's too late.
                Liberals must enact 5 Liberal policies. Fascists must enact 6 Fascist policies or elect Hitler as Chancellor.
            </div>
        </div>
    );
};
