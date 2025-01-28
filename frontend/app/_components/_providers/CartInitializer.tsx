"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/src/libs/services/customerServices/cartService";
import { useAuth } from "@/src/libs/customHooks/useAuth";

export function CartInitializer() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Initialize cart data in React Query cache
    queryClient.prefetchQuery({
      queryKey: ["cart"],
      queryFn: () => cartService.fetchCart(),
    });
  }, [isAuthenticated, queryClient]);

  return null;
}
