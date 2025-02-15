"use client";

import { useEffect } from "react";
import { useAuth } from "@/src/libs/customHooks/useAuth";
import { useWishlistQuery } from "@/src/libs/customHooks/useWishlist";


export function WishlistInitializer() {
  const { isAuthenticated, isUser } = useAuth();
  const { refreshWishlist } = useWishlistQuery();

    
  useEffect(() => {
    if (isAuthenticated && isUser) {
      refreshWishlist();
    }
  }, [isAuthenticated, refreshWishlist, isUser]);

  return null;
}
