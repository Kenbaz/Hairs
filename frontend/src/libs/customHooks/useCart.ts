import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "../services/customerServices/cartService";
import { AddToCartData, UpdateCartItemData } from "@/src/types";
import { toast } from "react-hot-toast";

export const useCartQuery = () => {
  const queryClient = useQueryClient();

  // Fetch cart
  const {
    data: cart,
    isLoading,
    error,
    refetch: refreshCart,
  } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartService.fetchCart(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Add to cart mutation
  const addToCart = useMutation({
    mutationFn: (data: AddToCartData) => cartService.addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    },
    onError: (error) => {
        console.error(error instanceof Error ? error.message : "Failed to add to cart");
      toast.error(
        "Failed to add to cart"
      );
    },
  });

  // Update cart item mutation
  const updateCartItem = useMutation({
    mutationFn: (data: UpdateCartItemData) => cartService.updateCartItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
        console.error(error instanceof Error ? error.message : "Failed to update cart");
      toast.error(
        "Failed to update cart"
      );
    },
  });

  // Remove from cart mutation
  const removeFromCart = useMutation({
    mutationFn: (itemId: number) => cartService.removeFromCart(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Item removed from cart");
    },
    onError: (error) => {
        console.error(error instanceof Error ? error.message : "Failed to remove");
      toast.error(
        "Failed to remove item"
      );
    },
  });

  // Clear cart mutation
  const clearCart = useMutation({
    mutationFn: () => cartService.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Cart cleared");
    },
    onError: (error) => {
        console.error(error instanceof Error ? error.message : "Failed to clear cart");
      toast.error(
         "Failed to clear cart"
      );
    },
  });

  // Merge cart mutation (for after login)
  const mergeCart = useMutation({
    mutationFn: () => cartService.mergeCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  return {
    // Data
    cart,
    isLoading,
    error,

    // Actions
    addToCart: addToCart.mutate,
    updateCartItem: updateCartItem.mutate,
    removeFromCart: removeFromCart.mutate,
    clearCart: clearCart.mutate,
    mergeCart: mergeCart.mutate,
    refreshCart,

    // Loading states
    isAddingToCart: addToCart.isPending,
    isUpdatingCart: updateCartItem.isPending,
    isRemovingFromCart: removeFromCart.isPending,
    isClearingCart: clearCart.isPending,
    isMergingCart: mergeCart.isPending,
  };
};
