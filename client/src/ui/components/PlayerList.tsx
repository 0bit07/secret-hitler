import React from 'react';
import { Player } from '../../types';
import { PlayerCard } from './PlayerCard';

interface PlayerListProps {
    players: Player[];
    currentPlayerId: string;
    presidentIndex: number;
    chancellorId: string | null;
    ownerId?: string; // [NEW]
    nomineeId?: string | null;
    votes?: Record<string, string>; // playerId -> vote
    onSelectPlayer?: (playerId: string) => void;
    selectableFilter?: (player: Player) => boolean;
}

export const PlayerList: React.FC<PlayerListProps> = ({
    players,
    currentPlayerId,
    presidentIndex,
    chancellorId,
    ownerId,
    nomineeId = null,
    votes,
    onSelectPlayer,
    selectableFilter
}) => {
    const presidentId = players[presidentIndex]?.id;

    return (
        <div className="flex flex-wrap justify-center gap-4 py-4 w-full">
            {players.map((player) => (
                <PlayerCard
                    key={player.id}
                    player={player}
                    currentPlayerId={currentPlayerId}
                    isPresident={player.id === presidentId}
                    isChancellor={player.id === chancellorId}
                    isNominee={player.id === nomineeId}
                    isHost={player.id === ownerId}
                    voteStatus={votes ? (votes[player.id] as any) : undefined}
                    selectable={selectableFilter ? selectableFilter(player) : false}
                    onClick={() => onSelectPlayer && onSelectPlayer(player.id)}
                />
            ))}
        </div>
    );
};
