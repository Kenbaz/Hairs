import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import {
  CartResponse,
  CartError,
  AddToCartData,
  UpdateCartItemData,
  CartItem,
  ValidatedCartItem,
  CartValidationResponse
} from "@/src/types";
import { store } from "../../_redux/store";


const CART_STORAGE_KEY = "guestCart";

class CartService {
  private readonly baseUrl = "/api/v1/cart";
  private readonly GUEST_CART_KEY = "guestCart";
  private readonly VALIDATION_INTERVAL = 60 * 60 * 1000;
  private lastValidation: number = 0;

  private isAuthenticated(): boolean {
    return store.getState().auth.isAuthenticated;
  }

  // Get or create session ID for guest cart
  private getSessionId(): string {
    let sessionId = localStorage.getItem("cartSessionId");
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;
      localStorage.setItem("cartSessionId", sessionId);
    }
    return sessionId;
  }

  // Get guest crt from localStorage
  private getGuestCartFromStorage(): CartItem[] {
    try {
      const cart = localStorage.getItem(this.GUEST_CART_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch {
      return [];
    }
  }

  // Save guest cart to localStorage and server
  private async saveGuestCart(items: CartItem[]): Promise<void> {
    try {
      // Save to localStorage
      localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(items));

      // Save to server if needed
      if (this.shouldValidateCart()) {
        await this.syncGuestCartWithServer(items);
      }
    } catch (error) {
      console.error("Failed to save guest cart:", error);
    }
  }

  private shouldValidateCart(): boolean {
    const now = Date.now();
    if (now - this.lastValidation >= this.VALIDATION_INTERVAL) {
      this.lastValidation = now;
      return true;
    }
    return false;
  }

  // Sync guest cart with server
  private async syncGuestCartWithServer(items: CartItem[]): Promise<void> {
    try {
      const sessionId = this.getSessionId();
      const response = await axiosInstance.post<CartValidationResponse>(
        `${this.baseUrl}/sync_guest/`,
        {
          session_id: sessionId,
          items: items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
        }
      );

      // Update local cart with validated data from server
      if (response.data?.items) {
        const validatedItems = items.filter((item) =>
          response.data.items.some(
            (validItem: ValidatedCartItem) =>
              validItem.product_id === item.product.id &&
              validItem.is_available &&
              validItem.stock >= validItem.quantity
          )
        );

        // Update localStorage with validated items
        localStorage.setItem(
          this.GUEST_CART_KEY,
          JSON.stringify(validatedItems)
        );
      }
    } catch (error) {
      // If sync fails, just log error but don't block the user
      console.warn("Failed to sync guest cart with server:", error);

      // For 404 errors, don't show error to user as sync is optional
      if ((error as AxiosError).response?.status !== 404) {
        throw error;
      }
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
      const items = this.getGuestCartFromStorage();

      // Validate cart if needed
      if (this.shouldValidateCart()) {
        try {
          await this.syncGuestCartWithServer(items);
        } catch (error) {
          console.warn("Cart sync failed:", error);
        }
      }

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
      const items = this.getGuestCartFromStorage();

      // Check if product already exists in cart
      const existingItemIndex = items.findIndex(
        (item) => item.product.id === data.product_id
      );

      try {
        // If item exists, update quantity
        if (existingItemIndex >= 0) {
          items[existingItemIndex].quantity += data.quantity;
        } else {
          // Add new item using the product data we already have
          items.push({
            id: Date.now(),
            product: {
              id: data.product_id,
              name: data.productData.name,
              price: data.productData.price_data.amount,
              discount_price: data.productData.price_data.discount_amount,
              image: data.productData.primary_image.url,
              stock: data.productData.stock,
              category: {
                id: data.productData.category.id,
                name: data.productData.category.name,
              },
            },
            quantity: data.quantity,
            price_at_add:
              data.productData.price_data.discount_amount ||
              data.productData.price_data.amount,
            created_at: new Date().toISOString(),
          });
        }

        this.saveGuestCart(items);
        return {
          items,
          shipping_fee: 0,
          total_amount: items.reduce(
            (sum, item) => sum + item.price_at_add * item.quantity,
            0
          ),
        };
      } catch {
        throw new Error("Failed to add item to cart");
      }
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
      const items = this.getGuestCartFromStorage();
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
      const items = this.getGuestCartFromStorage().filter(
        (item) => item.id !== itemId
      );
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
      // Get both session ID and guest cart items
      const sessionId = localStorage.getItem("cartSessionId");
      const guestCartItems = this.getGuestCartFromStorage();

      console.log("Guest cart before merge:", guestCartItems);

      if (!guestCartItems || guestCartItems.length === 0) {
        return this.fetchCart();
      }

      // Send both session ID and cart items
      const response = await axiosInstance.post<CartResponse>(
        `${this.baseUrl}/merge/`,
        {
          session_id: sessionId,
          items: guestCartItems.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            price_at_add: item.price_at_add
          })),
        }
      );

      if (response.data) {
        // Clear guest cart after successful merge
        this.clearGuestCart();
      }

      return response.data;
    } catch (error) {
      const err = error as AxiosError<CartError>;
      console.error("Merge error:", err);
      throw new Error(err.response?.data?.message || "Failed to merge cart");
    }
  }
}

export const cartService = new CartService();
