import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "../services/customerServices/cartService";
import { AddToCartData, UpdateCartItemData, CartResponse } from "@/src/types";
import { useAppDispatch, useAppSelector } from "../_redux/hooks";
import { selectIsCartOpen, openCart, closeCart } from "../_redux/cartSlice";
import { showToast } from "@/app/_components/_providers/ToastProvider";

export const useCartQuery = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const isCartOpen = useAppSelector(selectIsCartOpen);

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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      return { previousCartData: queryClient.getQueryData(["cart"]) };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
      showToast.success("Added to cart");
    },
    onError: (error, _, context) => {
      // Rollback to previous value
      if (context?.previousCartData) {
        queryClient.setQueryData(["cart"], context.previousCartData);
      }
      console.error(
        error instanceof Error ? error.message : "Failed to add to cart"
      );
      showToast.error("Failed to add to cart");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });


  // Update cart item mutation
  const updateCartItem = useMutation({
    mutationFn: (data: UpdateCartItemData) => cartService.updateCartItem(data),
    onMutate: async (updatedItem) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCartData = queryClient.getQueryData(["cart"]);

      // Optimistically update cart
      queryClient.setQueryData(["cart"], (old: CartResponse | undefined) => {
        if (!old)
          return {
            items: [],
            total_amount: 0,
            shipping_fee: 0,
          };

        return {
          ...old,
          items: old.items.map((item) =>
            item.id === updatedItem.item_id
              ? { ...item, quantity: updatedItem.quantity }
              : item
          ),
        };
      });

      return { previousCartData };
    },
    onError: (error, _, context) => {
      if (context?.previousCartData) {
        queryClient.setQueryData(["cart"], context.previousCartData);
      }
      console.error(
        error instanceof Error ? error.message : "Failed to update cart"
      );
      showToast.error("Failed to update cart");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });


  // Remove from cart mutation
  const removeFromCart = useMutation({
    mutationFn: (itemId: number) => cartService.removeFromCart(itemId),
    onMutate: async (removedItemId) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData(["cart"]);

      // Optimistically remove item
      queryClient.setQueryData(["cart"], (old: CartResponse | undefined) => {
        if (!old) return { items: [], total_amount: 0, shipping_fee: 0 };

        return {
          ...old,
          items: old.items.filter((item) => item.id !== removedItemId),
        };
      });

      return { previousCart };
    },
    onSuccess: () => {
      showToast.success("Item removed from cart");
    },
    onError: (error, _, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
      console.error("Failed to remove item:", error);
      showToast.error("Failed to remove item");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });


  // Clear cart mutation
  const clearCart = useMutation({
    mutationFn: () => cartService.clearCart(),
    onSuccess: () => {
      queryClient.setQueryData(["cart"], { items: [], total_amount: 0 });
      showToast.success("Cart cleared");
    },
    onError: (error) => {
      console.error(
        error instanceof Error ? error.message : "Failed to clear cart"
      );
      showToast.error("Failed to clear cart");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });


  // Merge cart mutation (for after login)
  const mergeCart = useMutation({
    mutationFn: () => cartService.mergeCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });


  // Move to wishlist mutation
  const moveToWishlist = useMutation({
    mutationFn: (itemId: number) => cartService.moveItemToWishlist(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData(["cart"]);

      queryClient.setQueryData(["cart"], (old: CartResponse | undefined) => {
        if (!old) return { items: [], total_amount: 0, shipping_fee: 0 };

        // Completely reconstruct the cart without the item
        const updatedItems = old.items.filter((item) => item.id !== itemId);

        return {
          ...old,
          items: updatedItems,
          total_amount: updatedItems.reduce(
            (sum, item) => sum + item.quantity * item.price_at_add,
            0
          ),
        };
      });

      return { previousCart };
    },
    onError: (error, _, context) => {
      // Rollback to previous cart state
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }

      console.error("Failed to move item to wishlist:", error);
      showToast.error(error.message);
    },
    onSettled: () => {
      // Invalidate both cart and wishlist queries
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onSuccess: () => {
      showToast.success("Item moved to wishlist");
    },
  });


  // Calculate cart summary
  const CartSummary = {
    totalItems: cart?.items.length ?? 0,
    subtotal:
      cart?.items.reduce(
        (sum, item) => sum + item.quantity * item.price_at_add,
        0
      ) ?? 0,
    shippingFee: cart?.shipping_fee ?? 0,
    total:
      (cart?.items.reduce(
        (sum, item) => sum + item.quantity * item.price_at_add,
        0
      ) ?? 0) + (cart?.shipping_fee ?? 0),
  };


  // Cart drawer controls
  const handleCloseCart = () => {
    dispatch(closeCart());
  };

  const toggleCart = () => {
    if (isCartOpen) {
      handleCloseCart();
    } else {
      dispatch(openCart());
    }
  };


  return {
    // Data
    cart,
    CartSummary,
    isCartOpen,

    // Actions
    addToCart: addToCart.mutate,
    updateCartItem: updateCartItem.mutate,
    removeFromCart: removeFromCart.mutate,
    moveToWishlist: moveToWishlist.mutate,
    clearCart: clearCart.mutate,
    mergeCart,
    refreshCart,
    toggleCart,
    openCart: () => dispatch(openCart()),
    closeCart: handleCloseCart,

    // Loading states
    isLoading,
    error,
    isAddingToCart: addToCart.isPending,
    isUpdatingCart: updateCartItem.isPending,
    isRemovingFromCart: removeFromCart.isPending,
    isClearingCart: clearCart.isPending,
    isMergingCart: mergeCart.isPending,
    isMovingToWishlist: moveToWishlist.isPending,

    // Helper methods
    isItemInCart: (productId: number) =>
      Boolean(cart?.items.some((item) => item.product.id === productId)),
    
    getItemQuantity: (productId: number) =>
      cart?.items.find((item) => item.product.id === productId)?.quantity ?? 0,
  };
};
