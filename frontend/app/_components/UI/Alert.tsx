"use client";

import React from "react";

interface AlertProps {
  type?: "success" | "error" | "warning" | "info";
  message: string;
  className?: string;
}

export function Alert({ type = "info", message, className = "" }: AlertProps) {
  const types = {
    success: "bg-green-500/20 text-green-800 border-green-500/20",
    error: "bg-red-500/20 text-red-800 border-red-500/20",
    warning: "bg-yellow-500/20 text-yellow-800 border-yellow-500/20",
    info: "bg-blue-500/20 text-blue-800 border-blue-500/20",
  };

  return (
    <div
      className={`
      p-4 rounded-lg border
      ${types[type]}
      ${className}
    `}
    >
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
