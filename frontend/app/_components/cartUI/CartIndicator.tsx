"use client";

import { ShoppingCart } from "lucide-react";
import { useCartQuery } from "@/src/libs/customHooks/useCart";

interface CartIndicatorProps {
  onClick?: () => void;
  className?: string;
}

export function CartIndicator({ onClick, className = "" }: CartIndicatorProps) {
  const { cart, isLoading } = useCartQuery();
  const itemCount = cart?.items.length || 0;

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-gray-900 ${className}`}
      disabled={isLoading}
    >
      <ShoppingCart className="h-6 w-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-xs text-white flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </button>
  );
}
