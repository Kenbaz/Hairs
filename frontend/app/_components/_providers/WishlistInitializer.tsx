"use client";

import { useEffect } from "react";
import { useAuth } from "@/src/libs/customHooks/useAuth";
import { useWishlistQuery } from "@/src/libs/customHooks/useWishlist";


export function WishlistInitializer() {
  const { isAuthenticated } = useAuth();
  const { refreshWishlist } = useWishlistQuery();

    
  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist();
    }
  }, [isAuthenticated, refreshWishlist]);

  return null;
}
