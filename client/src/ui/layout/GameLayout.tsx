import React from 'react';

interface GameLayoutProps {
    children: React.ReactNode;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4">
            {/* Background Layer - Placeholder for now, can be an image later */}
            <div className="fixed inset-0 bg-gradient-to-br from-gray-800 to-black -z-10" />

            {/* Main Container */}
            <main className="w-full max-w-5xl bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl p-6 min-h-[600px] relative overflow-hidden">
                {children}
            </main>

            {/* Footer / Debug Info (Optional) */}
            <footer className="mt-4 text-gray-500 text-xs text-center">
                Secret Hitler • Phase A UI
            </footer>
        </div>
    );
};
