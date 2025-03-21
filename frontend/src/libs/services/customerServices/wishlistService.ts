import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import { Wishlist, WishlistResponse, MoveToCartResponse, ApiError } from "@/src/types";

class WishlistService {
  private readonly baseUrl = "/api/v1/wishlist/";

  // Fetch user's wishlist
  async fetchWishlist(): Promise<Wishlist> {
    try {
      const response = await axiosInstance.get<Wishlist>(this.baseUrl);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch wishlist"
      );
    }
  }

  // Add item to wishlist
  async addToWishlist(productId: number): Promise<WishlistResponse> {
    try {
      const response = await axiosInstance.post<WishlistResponse>(
        `${this.baseUrl}add_item/`,
        { product_id: productId }
      );
      console.log("Add to wishlist response:", response.data);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to add item to wishlist"
      );
    }
  }

  // Remove item from wishlist
  async removeFromWishlist(productId: number): Promise<WishlistResponse> {
    try {
      const response = await axiosInstance.post<WishlistResponse>(
        `${this.baseUrl}remove_item/`,
        { product_id: productId }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to remove item from wishlist"
      );
    }
  }

  // Clear entire wishlist
  async clearWishlist(): Promise<WishlistResponse> {
    try {
      const response = await axiosInstance.post<WishlistResponse>(
        `${this.baseUrl}clear/`
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to clear wishlist"
      );
    }
  }

  // Check if product is in wishlist
  async checkInWishlist(productId: number): Promise<boolean> {
    try {
      const response = await axiosInstance.get<{ is_in_wishlist: boolean }>(
        `${this.baseUrl}check_product/`,
        {
          params: { product_id: productId },
        }
      );
      return response.data.is_in_wishlist;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to check wishlist status"
      );
    }
  }

  // Move item to cart and remove from wishlist
  async moveToCart(
    productId: number
  ): Promise<MoveToCartResponse> {
    try {
      const response = await axiosInstance.post<MoveToCartResponse>(`${this.baseUrl}move_to_cart/`, { product_id: productId });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to move item to cart"
      );
    }
  }
}

export const wishlistService = new WishlistService();
