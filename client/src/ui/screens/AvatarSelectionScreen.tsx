import React from 'react';
import { AvatarSelection } from '../components/AvatarSelection';
import { PhaseHeader } from '../components/PhaseHeader';

interface AvatarSelectionScreenProps {
    roomId: string; // Passed for header context (optional)
    currentAvatarId: string;
    onSelectAvatar: (avatarId: string) => void;
}

export const AvatarSelectionScreen: React.FC<AvatarSelectionScreenProps> = ({
    roomId,
    currentAvatarId,
    onSelectAvatar
}) => {
    // We can filter out taken avatars if we want to be strict, but server validation handles it too.
    // For now, let's just show all.

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
            <PhaseHeader
                title="Select Identity"
                subtitle={`Room Code: ${roomId}`}
            />

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-200">Choose Your Disguise</h2>
                <p className="text-gray-400">
                    Select an avatar to represent you in the lobby.
                </p>
            </div>

            <div className="bg-gray-900/50 p-8 rounded-xl border border-gray-700 w-full max-w-2xl">
                <AvatarSelection
                    selectedAvatar={currentAvatarId}
                    onSelect={onSelectAvatar}
                />
            </div>

            {/* Note: In this phase, selecting immediately updates via socket if we send the action on click. 
                Or we can have a "Confirm" button. 
                Platform Action `SELECT_AVATAR` updates state. 
                So clicking an avatar should trigger the action.
            */}
        </div>
    );
};
