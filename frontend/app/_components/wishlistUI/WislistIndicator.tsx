"use client";

import { Heart } from "lucide-react";
import {useWishlistQuery} from "@/src/libs/customHooks/useWishlist";

interface WishlistIndicatorProps {
  onClick?: () => void;
  className?: string;
}

export function WishlistIndicator({
  onClick,
  className = "",
}: WishlistIndicatorProps) {
  const { itemCount, isLoading } = useWishlistQuery();

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-gray-900 ${className}`}
      disabled={isLoading}
    >
      <Heart className="h-6 w-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-xs text-white flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </button>
  );
}
