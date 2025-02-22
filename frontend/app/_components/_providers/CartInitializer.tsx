"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/src/libs/services/customerServices/cartService";
import { useAuth } from "@/src/libs/customHooks/useAuth";
import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { showToast } from "@/app/_components/_providers/ToastProvider";

export function CartInitializer() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isUser } = useAuth();
  const { mergeCart, refreshCart } = useCartQuery();
  const hasMergedRef = useRef(false);

  // Handle cart merging
  useEffect(() => {
    const handleMergeCart = async () => {
      if (isAuthenticated && isUser && !hasMergedRef.current) {
        try {
          // Check if there's a guest cart to merge
          const guestCart = localStorage.getItem("guestCart");
          if (!guestCart) {
            await queryClient.invalidateQueries({ queryKey: ["cart"] });
            return;
          }

          const guestCartItems = JSON.parse(guestCart);
          if (!guestCartItems.length) return;

          hasMergedRef.current = true;

          // Merge cart and invalidate cache
          await mergeCart.mutateAsync();

          // Force a fresh fetch of cart data
          await queryClient.invalidateQueries({ queryKey: ["cart"] });
          await refreshCart();

          showToast.success("Cart merged successfully");
        } catch (error) {
          console.error("Failed to merge cart:", error);
          hasMergedRef.current = false;
          showToast.error("Failed to merge cart");
        }
      }
    };

    handleMergeCart();
  }, [isAuthenticated, mergeCart, isUser, refreshCart, queryClient]);

  // Initialize cart data in React Query cache
  useEffect(() => {
    if (isAuthenticated && isUser) {
      queryClient.prefetchQuery({
        queryKey: ["cart"],
        queryFn: () => cartService.fetchCart(),
      });
    }
  }, [isAuthenticated, queryClient, isUser]);

  return null;
}
