"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/src/libs/customHooks/useAuth";
import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { showToast } from "@/app/_components/_providers/ToastProvider";

export function CartInitializer() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { mergeCart, refreshCart } = useCartQuery();
  const hasMergedRef = useRef(false);

  // Handle cart merging
  useEffect(() => {
    const handleCartInitialization = async () => {
      // Prevent multiple executions
      if (!isAuthenticated || hasMergedRef.current) return;

      try {
        // Check if there's a guest cart to merge
        const guestCart = localStorage.getItem("guestCart");

        if (guestCart) {
          const guestCartItems = JSON.parse(guestCart);
          if (guestCartItems.length) {
            // Mark as merged to prevent repeated attempts
            hasMergedRef.current = true;

            // Merge cart
            await mergeCart.mutateAsync();

            // Clear guest cart after successful merge
            localStorage.removeItem("guestCart");

            // Show toast only if merge actually occurred
            showToast.success("Cart updated successfully");
          }
        }

        // Invalidate and refetch cart data
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
        await refreshCart();
      } catch (error) {
        console.error("Failed to initialize cart:", error);
        hasMergedRef.current = false;
        showToast.error("Failed to update cart");
      }
    };

    handleCartInitialization();
  }, [isAuthenticated, mergeCart, refreshCart, queryClient]);

  return null;
}
