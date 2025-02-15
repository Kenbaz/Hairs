import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistService } from "../services/customerServices/wishlistService";
import { useAuth } from "./useAuth";
import { toast } from "react-hot-toast";


export const useWishlistQuery = (productId?: number) => {
  const queryClient = useQueryClient();
  const { isAuthenticated, isUser } = useAuth();

    
  // Fetch wishlist
  const {
    data: wishlist,
    isLoading,
    error,
    refetch: refreshWishlist,
  } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistService.fetchWishlist(),
    staleTime: 60 * 60 * 1000,
    enabled: isAuthenticated && isUser,
  });

    
  // Check if product is in wishlist
  const isInWishlist = Boolean(
    productId && wishlist?.items.some((item) => item.product.id === productId)
  );

    
  // Add to wishlist mutation
  const addToWishlist = useMutation({
    mutationFn: (productId: number) => wishlistService.addToWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Added to wishlist");
    },
    onError: (error) => {
      console.error("Failed to add to wishlist:", error);
      toast.error("Failed to add to wishlist");
    },
  });

    
  // Remove from wishlist mutation
  const removeFromWishlist = useMutation({
    mutationFn: (productId: number) =>
      wishlistService.removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
    onError: (error) => {
      console.error("Failed to remove from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    },
  });

    
  // Clear wishlist mutation
  const clearWishlist = useMutation({
    mutationFn: () => wishlistService.clearWishlist(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Wishlist cleared");
    },
    onError: (error) => {
      console.error("Failed to clear wishlist:", error);
      toast.error("Failed to clear wishlist");
    },
  });

    
  // Move to cart mutation
  const moveToCart = useMutation({
    mutationFn: (productId: number) => wishlistService.moveToCart(productId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(data.message);
    },
    onError: (error) => {
      console.error("Failed to move item to cart:", error);
      toast.error("Failed to move item to cart");
    },
  });

    
  const toggleItem = async (itemId: number) => {
    if (!isAuthenticated) {
      throw new Error("Please login to manage wishlist");
    }

    if (isInWishlist) {
      await removeFromWishlist.mutateAsync(itemId);
    } else {
      await addToWishlist.mutateAsync(itemId);
    }
  };

    
  return {
    // Data
    wishlist,
    items: wishlist?.items ?? [],
    isLoading,
    error,
    isInWishlist,
    isEmpty: !wishlist?.items.length,
    itemCount: wishlist?.items.length ?? 0,

    // Mutations
    addItem: addToWishlist.mutate,
    removeItem: removeFromWishlist.mutate,
    toggleItem,
    clear: clearWishlist.mutate,
    moveItemToCart: moveToCart.mutate,

    // Loading states
    isAdding: addToWishlist.isPending,
    isRemoving: removeFromWishlist.isPending,
    isClearing: clearWishlist.isPending,
    isMovingToCart: moveToCart.isPending,

    // Refresh
    refreshWishlist,
  };
};
