import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "../services/customerServices/cartService";
import { AddToCartData, UpdateCartItemData, CartResponse } from "@/src/types";
import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../_redux/hooks";
import { selectIsCartOpen, openCart, closeCart } from "../_redux/cartSlice";
import { showToast } from "@/app/_components/_providers/ToastProvider";

export const useCartQuery = (autoCloseDelay = 3000) => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const isCartOpen = useAppSelector(selectIsCartOpen);
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout>();

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

  // Cleanup timeout on unmount
  useEffect(() => {
    const timeoutRef = autoCloseTimeoutRef.current;

    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, []);


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
      dispatch(openCart());

      // Clear any existing timeout
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }

      // Set new timeout
      autoCloseTimeoutRef.current = setTimeout(() => {
        dispatch(closeCart());
        autoCloseTimeoutRef.current = undefined;
      }, autoCloseDelay);
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
  // Clear auto-close timeout when manually closing cart
  const handleCloseCart = () => {
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = undefined;
    }
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

    // Helper methods
    isItemInCart: (productId: number) =>
      Boolean(cart?.items.some((item) => item.product.id === productId)),
    
    getItemQuantity: (productId: number) =>
      cart?.items.find((item) => item.product.id === productId)?.quantity ?? 0,
  };
};
