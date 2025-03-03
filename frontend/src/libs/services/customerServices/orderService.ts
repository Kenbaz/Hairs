import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import { CustomerOrder, CustomerOrderResponse, CreateOrderData, ApiError, OrderFilters } from "@/src/types";

class OrderService {
  private readonly baseUrl = "/api/v1/orders/";

  // Get all orders with optional filters
  async getOrders(filters?: OrderFilters): Promise<CustomerOrderResponse> {
    try {
      // Convert filters to query params
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axiosInstance.get<CustomerOrderResponse>(
        `${this.baseUrl}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch orders"
      );
    }
  }

  // Get single order details
  async getOrderDetails(orderId: number): Promise<CustomerOrder> {
    try {
      const response = await axiosInstance.get<CustomerOrder>(
        `${this.baseUrl}${orderId}/`
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch order details"
      );
    }
  }

  // Cancel an order
  async cancelOrder(orderId: number): Promise<CustomerOrder> {
    try {
      const response = await axiosInstance.post<CustomerOrder>(
        `${this.baseUrl}${orderId}/cancel/`
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to cancel order"
      );
    }
  }

  // Create a new order
  async createOrder(data: CreateOrderData): Promise<CustomerOrder> {
    try {
      const response = await axiosInstance.post<CustomerOrder>(this.baseUrl, data);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to create order"
      );
    }
  }
}

export const orderService = new OrderService();