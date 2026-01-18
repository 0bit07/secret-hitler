

interface AvatarSelectionProps {
    selectedAvatar: string;
    onSelect: (id: string) => void;
    // We could pass taken avatars here if we knew them, but currently we don't know room state before joining.
    // So we'll just let them pick.
}

const AVATAR_COUNT = 12;

export function AvatarSelection({ selectedAvatar, onSelect }: AvatarSelectionProps) {
    const avatars = Array.from({ length: AVATAR_COUNT }, (_, i) => {
        const num = i + 1;
        const id = `avatar-${num.toString().padStart(2, '0')}`;
        // Import dynamically? Vite supports glob import, but standard import is cleaner if fewer.
        // Actually, let's assume we pass the ID and the parent component constructs the path or we use a helper.
        // For now, I'll construct the path string directly since assets are static.
        // Wait, in Vite/React, I need the imported URL.
        // I can't just use string paths unless they are in public/.
        // If they are in src/assets, I must import them.
        return id;
    });

    // Helper to get asset URL (requires glob import or massive switch)
    // Let's use a glob import map or just a switch for now.
    // Or better: Pass the images from a constants file.

    return (
        <div className="grid grid-cols-4 gap-4 p-4 max-h-96 overflow-y-auto">
            {avatars.map((id) => (
                <button
                    key={id}
                    onClick={() => onSelect(id)}
                    className={`
                        relative rounded-full aspect-square overflow-hidden border-4 transition-all
                        ${selectedAvatar === id
                            ? 'border-yellow-400 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                            : 'border-transparent hover:border-gray-400 hover:scale-105 opacity-70 hover:opacity-100'}
                    `}
                >
                    {/* 
                      For now using /avatars/ path which should be in public folder.
                      If images are not there, they will be broken. 
                      User provided initial setup likely has them or we should have moved them. 
                      Assuming public/avatars/ exists.
                    */}
                    <img
                        src={`/avatars/${id}.png`}
                        alt={id}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback if image missing
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.style.backgroundColor = '#333';
                            e.currentTarget.parentElement!.innerText = id.replace('avatar-', '');
                        }}
                    />
                </button>
            ))}
        </div>
    );
}
