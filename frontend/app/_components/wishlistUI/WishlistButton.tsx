'use client';

import React from "react";
import { Heart } from "lucide-react";
import { Button } from "../UI/Button";
import { useWishlistQuery } from "@/src/libs/customHooks/useWishlist";
import { useAuth } from "@/src/libs/customHooks/useAuth";
import { useRouter } from "next/navigation";


interface WishlistButtonProps { 
    productId: number;
    className?: string;
    showText?: boolean;
}


export function WishlistButton({
    productId,
    className = '',
    showText = false,
}: WishlistButtonProps) { 
    const router = useRouter();
    const { isAuthenticated } = useAuth(); 
    const { isInWishlist, toggleItem, isLoading } = useWishlistQuery(productId);


    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        try {
            await toggleItem(productId);
        } catch (error) {
            console.error('Failed to update wishlist', error);
        }
    };


    return (
      <Button
        onClick={handleClick}
        variant={isInWishlist ? "primary" : "outline"}
        size="sm"
        className={`relative ${className}`}
        isLoading={isLoading}
        disabled={isLoading}
      >
        <Heart className={`h-5 w-5 ${isInWishlist ? "fill-current" : ""}`} />
        {showText && (
          <span className="ml-2">
            {isInWishlist ? "In Wishlist" : "Add to Wishlist"}
          </span>
        )}
      </Button>
    );
}