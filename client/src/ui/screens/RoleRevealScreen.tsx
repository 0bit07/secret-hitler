import { useState } from 'react';
import { GameState } from '../../types';
import { RoleCard } from '../components/RoleCard';
import { ActionButton } from '../components/ActionButton';
import { PhaseHeader } from '../components/PhaseHeader';

interface RoleRevealScreenProps {
    gameState: GameState;
    currentPlayerId: string;
    onAcknowledge: () => void;
}

export function RoleRevealScreen({ gameState, currentPlayerId, onAcknowledge }: RoleRevealScreenProps) {
    const player = gameState.players.find(p => p.id === currentPlayerId);
    // If player has already seen role, we default to "Revealed" state internally (or skip UI)
    // Constraint: "If player.hasAcknowledgedRole === true ... show 'Waiting...'"
    const [isInternalRevealed, setIsInternalRevealed] = useState(false);

    if (!player) return <div>Error: Player not found</div>;

    const hasAcked = player.hasSeenRole;
    console.log('RoleRevealScreen State:', {
        roleAcknowledgementCount: gameState.roleAcknowledgementCount,
        playersLength: gameState.players.length,
        hasAcked
    });

    // Privacy note: p.role is only visible if p.id === currentPlayerId (server enforced)
    // or if Fascist/Hitler logic applies.
    // For the MAIN card, we show the player's OWN role.

    if (hasAcked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-8 animate-fade-in">
                <PhaseHeader
                    title="SECRET ROLE ASSIGNMENT"
                    subtitle={gameState.ownerId ? `Room Host: ${gameState.ownerId}` : undefined}
                />
                <div className="text-3xl font-bold text-white tracking-widest animate-pulse">
                    WAITING FOR PLAYERS
                </div>
                <div className="text-xl text-gray-400">
                    {gameState.roleAcknowledgementCount} / {gameState.players.length} Confirmed
                </div>
                <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                    <div
                        className="h-full bg-yellow-500 transition-all duration-500"
                        style={{ width: `${(gameState.roleAcknowledgementCount / gameState.players.length) * 100}%` }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen pb-12 animate-fade-in">
            <PhaseHeader
                title="SECRET ROLE ASSIGNMENT"
                subtitle="Top Secret"
            />

            <div className="flex flex-col items-center space-y-8 mt-8">
                {/* Instruction Text */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl text-white font-bold">
                        {isInternalRevealed ? "MEMORIZE YOUR ROLE" : "IDENTIFY CONFIRMATION"}
                    </h2>
                    <p className="text-gray-400 max-w-md">
                        {isInternalRevealed
                            ? "Confirm your allegiance to proceed. This information is secret."
                            : "Click the card below to reveal your secret identity."}
                    </p>
                </div>

                {/* Card Area */}
                <RoleCard
                    role={player.role}
                    party={player.party}
                    isRevealed={isInternalRevealed}
                    onFlip={() => !isInternalRevealed && setIsInternalRevealed(true)}
                />

                {/* Actions */}
                <div className="h-16 flex items-end">
                    {isInternalRevealed && (
                        <ActionButton
                            label="CONFIRM IDENTITY"
                            onClick={onAcknowledge}
                            variant="success"
                            className="animate-bounce-short"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
