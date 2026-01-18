import React from 'react';

interface PhaseHeaderProps {
    title: string;
    subtitle?: string;
}

export const PhaseHeader: React.FC<PhaseHeaderProps> = ({ title, subtitle }) => {
    return (
        <div className="w-full text-center border-b border-gray-700 pb-4 mb-4">
            <h1 className="text-4xl font-black text-white tracking-widest uppercase shadow-black drop-shadow-md">
                {title}
            </h1>
            {subtitle && (
                <h2 className="text-lg text-gray-400 mt-1 font-mono uppercase tracking-wide">
                    {subtitle}
                </h2>
            )}
        </div>
    );
};
