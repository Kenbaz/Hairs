"use client";

import { useEffect } from "react";
import { useAuth } from "@/src/libs/customHooks/useAuth";
import { useWishlistQuery } from "@/src/libs/customHooks/useWishlist";

export function WishlistInitializer() {
  const { isAuthenticated } = useAuth();
  const { refreshWishlist } = useWishlistQuery();

  useEffect(() => {
    if (isAuthenticated) {
      // Force refresh wishlist on mount
      refreshWishlist()
        .then(() => {
          console.log("WishlistInitializer: wishlist refreshed successfully");
        })
        .catch((err) => {
          console.error("WishlistInitializer: error refreshing wishlist:", err);
        });
    }
  }, [isAuthenticated, refreshWishlist]);

  return null;
}
