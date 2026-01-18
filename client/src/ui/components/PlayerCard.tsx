import React from 'react';
import { Player } from '../../types';

interface PlayerCardProps {
    player: Player;
    currentPlayerId: string;
    isPresident: boolean;
    isChancellor: boolean;
    isNominee?: boolean;
    isHost?: boolean;
    onClick?: () => void;
    selectable?: boolean;
    voteStatus?: 'ja' | 'nein' | 'pending' | null;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
    player,
    currentPlayerId,
    isPresident,
    isChancellor,
    isNominee = false,
    isHost = false,
    onClick,
    selectable = false,
    voteStatus = null,
}) => {
    const isMe = player.id === currentPlayerId;
    const isDead = !player.alive;

    // Base style
    let cardStyle = "bg-gray-800 border-2 rounded-lg p-3 w-40 flex flex-col items-center gap-2 transition-all relative";

    // Border coloring based on status
    if (isPresident) cardStyle += " border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]";
    else if (isChancellor) cardStyle += " border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
    else if (isNominee) cardStyle += " border-yellow-400 border-dashed";
    else if (isHost) cardStyle += " border-yellow-600/50"; // Subtle highlight for host
    else cardStyle += " border-gray-600";

    // Selection
    if (selectable) cardStyle += " cursor-pointer hover:bg-gray-700 hover:scale-105 active:scale-95";
    if (isDead) cardStyle += " opacity-50 grayscale";

    return (
        <div className={cardStyle} onClick={selectable && !isDead ? onClick : undefined}>
            {/* Avatar / Role Icon (Placeholder for now) */}
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl border border-gray-600 relative">
                {player.alive ? '👤' : '💀'}
                {isHost && <span className="absolute -top-1 -right-1 text-base" title="Room Host">👑</span>}
            </div>

            {/* Name */}
            <div className="text-center">
                <div className={`font-bold truncate max-w-full ${isMe ? 'text-green-400' : 'text-white'}`}>
                    {player.name} {isMe && '(You)'}
                </div>
                <div className={`text-xs ${isHost ? 'text-yellow-400 font-bold' : 'text-gray-400'}`}>
                    {/* Only show role if visible (e.g. game over or known info logic handled by parent) */}
                    {/* For now, just show generic label unless dead */}
                    {isDead ? 'Executed' : (isHost ? 'Room Host' : 'Player')}
                </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-1 mt-1">
                {isPresident && <span className="px-2 py-0.5 bg-blue-900 text-blue-200 text-[10px] rounded uppercase font-bold tracking-wider">President</span>}
                {isChancellor && <span className="px-2 py-0.5 bg-red-900 text-red-200 text-[10px] rounded uppercase font-bold tracking-wider">Chancellor</span>}
                {isNominee && <span className="px-2 py-0.5 bg-yellow-900 text-yellow-200 text-[10px] rounded uppercase font-bold tracking-wider">Nominee</span>}
                {player.wasPresident && <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-[10px] rounded uppercase">Ex-Pres</span>}
                {player.wasChancellor && <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-[10px] rounded uppercase">Ex-Chanc</span>}
            </div>

            {/* Vote Status Overlay */}
            {voteStatus && (
                <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 shadow-md
          ${voteStatus === 'ja' ? 'bg-green-600 border-green-400 text-white' : ''}
          ${voteStatus === 'nein' ? 'bg-red-600 border-red-400 text-white' : ''}
          ${voteStatus === 'pending' ? 'bg-gray-500 border-gray-400 text-gray-300' : ''}
        `}>
                    {voteStatus === 'ja' && 'JA'}
                    {voteStatus === 'nein' && 'N'}
                    {voteStatus === 'pending' && '?'}
                </div>
            )}
        </div>
    );
};
