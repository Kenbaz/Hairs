'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'default';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export function Button({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'flex items-center justify-center font-medium transition-colors duration-150';

    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 rounded-lg",
      secondary:
        "bg-customBlack text-white hover:bg-gray-700 rounded-lg active:bg-gray-800",
      outline:
        "border-2 border-slate-700 rounded-lg text-slate-900 hover:bg-slate-50 active:bg-blue-100",
      danger:
        "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 rounded-lg",
      default: "text-gray-900",
    };

    const sizes = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const disabledStyles = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '';

    return (
        <button
            className={`
                ${baseStyles}
                ${variants[variant]}
                ${sizes[size]}
                ${disabledStyles}
                ${className}
            `}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (<Loader2 className='animate-spin'/>)}
            {children}
        </button>
    )
}