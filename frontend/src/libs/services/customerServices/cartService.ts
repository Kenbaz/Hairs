import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import {
  CartResponse,
  CartError,
  AddToCartData,
  UpdateCartItemData,
  CartItem,
  ProductResponse
} from "@/src/types";
import { store } from "../../_redux/store";
import { QueryClient } from "@tanstack/react-query";

const CART_STORAGE_KEY = "guestCart";

class CartService {
  private readonly baseUrl = "/api/v1/cart";

  private isAuthenticated(): boolean {
    return store.getState().auth.isAuthenticated;
  }

  private getGuestCart(): CartItem[] {
    try {
      const cart = localStorage.getItem(CART_STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch {
      return [];
    }
  }

  private saveGuestCart(items: CartItem[]): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save guest cart:", error);
    }
  }

  private clearGuestCart(): void {
    localStorage.removeItem(CART_STORAGE_KEY);
  }

  async fetchCart(): Promise<CartResponse> {
    if (this.isAuthenticated()) {
      try {
        const response = await axiosInstance.get<CartResponse>(this.baseUrl);
        return response.data;
      } catch (error) {
        const err = error as AxiosError<CartError>;
        throw new Error(err.response?.data?.message || "Failed to fetch cart");
      }
    } else {
      const items = this.getGuestCart();
      return {
        items,
        shipping_fee: 0,
        total_amount: items.reduce(
          (sum, item) => sum + item.price_at_add * item.quantity,
          0
        ),
      };
    }
  }

  async addToCart(data: AddToCartData): Promise<CartResponse> {
    if (this.isAuthenticated()) {
      try {
        const response = await axiosInstance.post<CartResponse>(
          `${this.baseUrl}/add_item/`,
          data
        );
        return response.data;
      } catch (error) {
        const err = error as AxiosError<CartError>;
        throw new Error(
          err.response?.data?.message || "Failed to add item to cart"
        );
      }
    } else {
      const items = this.getGuestCart();
      const existingItem = items.find(
        (item) => item.product.id === data.product_id
      );
      // Get product from React Query cache if available
      const queryClient = new QueryClient();
      const productsData = queryClient.getQueryData<ProductResponse>([
        "products",
      ]);
      const product = productsData?.results.find(
        (p) => p.id === data.product_id
      );

      if (!product) throw new Error("Product not found");

      if (existingItem) {
        existingItem.quantity += data.quantity;
      } else {
        items.push({
          id: Date.now(),
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            discount_price: product.discount_price,
            image: product.images?.[0]?.url,
            stock: product.stock,
            category: {
              id: product.category.id,
              name: product.category.name,
            },
          },
          quantity: data.quantity,
          price_at_add: product.discount_price || product.price,
          created_at: new Date().toISOString(),
        });
      }

      this.saveGuestCart(items);
      return this.fetchCart();
    }
  }

  async updateCartItem(data: UpdateCartItemData): Promise<CartResponse> {
    if (this.isAuthenticated()) {
      try {
        const response = await axiosInstance.post<CartResponse>(
          `${this.baseUrl}/update_quantity/`,
          data
        );
        return response.data;
      } catch (error) {
        const err = error as AxiosError<CartError>;
        throw new Error(
          err.response?.data?.message || "Failed to update cart item"
        );
      }
    } else {
      const items = this.getGuestCart();
      const itemIndex = items.findIndex((item) => item.id === data.item_id);

      if (itemIndex === -1) throw new Error("Item not found in cart");

      if (data.quantity <= 0) {
        items.splice(itemIndex, 1);
      } else {
        items[itemIndex].quantity = data.quantity;
      }

      this.saveGuestCart(items);
      return this.fetchCart();
    }
  }

  async removeFromCart(itemId: number): Promise<CartResponse> {
    if (this.isAuthenticated()) {
      try {
        const response = await axiosInstance.post<CartResponse>(
          `${this.baseUrl}/remove_item/`,
          { item_id: itemId }
        );
        return response.data;
      } catch (error) {
        const err = error as AxiosError<CartError>;
        throw new Error(
          err.response?.data?.message || "Failed to remove item from cart"
        );
      }
    } else {
      const items = this.getGuestCart().filter((item) => item.id !== itemId);
      this.saveGuestCart(items);
      return this.fetchCart();
    }
  }

  async clearCart(): Promise<CartResponse> {
    if (this.isAuthenticated()) {
      try {
        const response = await axiosInstance.post<CartResponse>(
          `${this.baseUrl}/clear/`
        );
        return response.data;
      } catch (error) {
        const err = error as AxiosError<CartError>;
        throw new Error(err.response?.data?.message || "Failed to clear cart");
      }
    } else {
      this.clearGuestCart();
      return this.fetchCart();
    }
  }

  async mergeCart(): Promise<CartResponse> {
    if (!this.isAuthenticated()) {
      throw new Error("User must be authenticated to merge cart");
    }

    try {
      const response = await axiosInstance.post<CartResponse>(
        `${this.baseUrl}/merge/`
      );
      this.clearGuestCart();
      return response.data;
    } catch (error) {
      const err = error as AxiosError<CartError>;
      throw new Error(err.response?.data?.message || "Failed to merge cart");
    }
  }
}

export const cartService = new CartService();
