import React, { ReactNode } from 'react';

interface CardProps {
    image?: string;
    src?: string; // specific alias
    alt?: string;
    label?: string;
    type?: 'role' | 'policy' | 'board';
    className?: string;
    onClick?: () => void;
    selected?: boolean;
    children?: ReactNode;
}

export const Card: React.FC<CardProps> = ({
    image,
    src,
    alt = 'Card',
    label,
    // type = 'policy',
    className = '',
    onClick,
    selected = false,
    children
}) => {
    // Resolve image source
    const imageSrc = image || src;

    return (
        <div
            onClick={onClick}
            className={`
                relative rounded-xl overflow-hidden shadow-2xl transition-all duration-300
                bg-gray-900 border-2
                ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-yellow-500/20' : ''}
                ${selected ? 'ring-4 ring-yellow-400 scale-105' : 'border-gray-700'}
                ${className}
            `}
        >
            {/* Image Layer */}
            {imageSrc && (
                <div className="w-full h-full p-2">
                    <img
                        src={imageSrc}
                        alt={alt}
                        className="w-full h-full object-contain drop-shadow-md rounded-lg"
                    />
                </div>
            )}

            {/* Label Overlay */}
            {label && (
                <div className="absolute bottom-4 left-0 w-full text-center">
                    <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/20 backdrop-blur-sm">
                        {label}
                    </span>
                </div>
            )}

            {/* Content Overlay (Children) */}
            {children && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    {children}
                </div>
            )}
        </div>
    );
};
