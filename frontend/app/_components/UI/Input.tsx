"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  className = "",
  label,
  error,
  disabled,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="mb-1 text-base font-medium text-gray-950">
          {label}
        </label>
      )}
      <input
        className={`
          px-4 py-2
          border bg-gray-50
          focus:outline-none
          disabled:bg-gray-100 disabled:cursor-not-allowed
          placeholder:text-gray-400
          ${error ? "border-red-500" : ""}
          ${className}
        `}
        disabled={disabled}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
