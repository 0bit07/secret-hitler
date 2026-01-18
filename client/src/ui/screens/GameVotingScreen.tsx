import React from 'react';
import { PlatformPlayer } from '../../types';
import { PhaseHeader } from '../components/PhaseHeader';

interface GameVotingScreenProps {
    roomId: string;
    players: PlatformPlayer[];
    gameVotes: Record<string, string>; // playerId -> gameId
    currentPlayerId: string;
    onVote: (gameId: string) => void;
}

// Hardcoded for now, or match GameRegistry from server
const AVAILABLE_GAMES = [
    { id: 'secret-hitler', name: 'Secret Hitler', minPlayers: 5, maxPlayers: 10, description: 'Social deduction & betrayl.' },
    { id: 'avalon', name: 'Avalon (Coming Soon)', minPlayers: 5, maxPlayers: 10, description: 'Knights & Minions.', disabled: true },
    { id: 'spyfall', name: 'Spyfall (Coming Soon)', minPlayers: 3, maxPlayers: 8, description: 'Find the spy.', disabled: true },
];

export const GameVotingScreen: React.FC<GameVotingScreenProps> = ({
    roomId,
    players,
    gameVotes,
    currentPlayerId,
    onVote
}) => {
    // Calculate Vote Counts
    const voteCounts: Record<string, number> = {};
    Object.values(gameVotes).forEach(gameId => {
        voteCounts[gameId] = (voteCounts[gameId] || 0) + 1;
    });

    const totalVotes = Object.keys(gameVotes).length;
    const currentVote = gameVotes[currentPlayerId];

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
            <PhaseHeader
                title="Mission Selection"
                subtitle={`Room Code: ${roomId}`}
            />

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-200">Vote for Next Game</h2>
                <p className="text-gray-400">
                    {totalVotes} / {players.length} Votes Cast
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4">
                {AVAILABLE_GAMES.map(game => {
                    const votes = voteCounts[game.id] || 0;
                    const isSelected = currentVote === game.id;

                    return (
                        <button
                            key={game.id}
                            onClick={() => !game.disabled && onVote(game.id)}
                            disabled={game.disabled}
                            className={`
                                relative flex flex-col items-center p-6 rounded-xl border-2 transition-all
                                ${isSelected
                                    ? 'border-yellow-500 bg-gray-800 shadow-[0_0_20px_rgba(234,179,8,0.3)] scale-105'
                                    : 'border-gray-700 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-800'}
                                ${game.disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
                            `}
                        >
                            {/* Vote Badge */}
                            {votes > 0 && (
                                <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {votes} Vote{votes !== 1 && 's'}
                                </div>
                            )}

                            <div className="text-4xl mb-4">📦</div>
                            <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
                            <p className="text-sm text-gray-400 text-center">{game.description}</p>

                            <div className="mt-4 text-xs font-mono text-gray-500">
                                {game.minPlayers}-{game.maxPlayers} Players
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* User Feedback */}
            {currentVote && (
                <div className="text-green-400 font-mono animate-pulse">
                    voted for {AVAILABLE_GAMES.find(g => g.id === currentVote)?.name || currentVote}
                </div>
            )}
        </div>
    );
};
