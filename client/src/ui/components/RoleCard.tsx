import { Card } from './Card';
import { Role, Party } from '../../types';
import libRole from '../../assets/roles/role-liberal.png';
import fasRole from '../../assets/roles/role-fascist.png';
import hitRole from '../../assets/roles/role-hitler.png';
import cardBack from '../../assets/cards/role-back.png'; // Role specific back

interface RoleCardProps {
    role: Role;
    party: Party;
    onFlip: () => void;
    isRevealed: boolean;
}

export function RoleCard({ role, onFlip, isRevealed }: RoleCardProps) {
    const getRoleAsset = () => {
        switch (role) {
            case Role.HITLER: return hitRole;
            case Role.FASCIST: return fasRole;
            case Role.LIBERAL:
            default: return libRole;
        }
    };


    return (
        <div className="perspective-1000 w-64 h-96 cursor-pointer" onClick={onFlip}>
            <div className={`relative w-full h-full text-center transition-transform duration-700 transform-style-3d ${isRevealed ? 'rotate-y-180' : ''}`}>

                {/* Front (Hidden/Back of Card) */}
                <div className="absolute w-full h-full backface-hidden">
                    <Card
                        type="policy" // Reuse style
                        image={cardBack}
                        className="w-full h-full transition-shadow hover:shadow-2xl hover:shadow-yellow-500/20"
                    />
                    {/* Overlay Text - Moved visually above (top-10) using translation or separate div */}
                    {/* Actually, user said "above the card". If I put it here, it rotates with the card. */}
                    {/* If I put it outside the rotation context, it won't rotate. */}
                    {/* But if I rely on `isRevealed` for visibility, I can put it outside the card container entirely? */}
                </div>

                {/* Back (Revealed/Face of Card) - Rotated */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180">
                    <Card
                        type="role"
                        image={getRoleAsset()}
                        className="w-full h-full shadow-2xl"
                    />
                </div>
            </div>

            {/* Click instruction - Outside rotation context, only visible when NOT revealed */}
            {!isRevealed && (
                <div className="absolute -top-16 left-0 w-full text-center pointer-events-none">
                    <div className="text-white text-xl font-bold tracking-widest animate-pulse px-4 py-2 drop-shadow-md">
                        CLICK TO REVEAL
                    </div>
                </div>
            )}
        </div>
    );
}
