import React from 'react';

interface ActionButtonProps {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'danger' | 'success' | 'neutral';
    className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    label,
    onClick,
    disabled = false,
    variant = 'primary',
    className = ''
}) => {
    const baseStyles = "px-6 py-3 rounded-lg font-bold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
        danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
        success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
        neutral: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {label}
        </button>
    );
};
