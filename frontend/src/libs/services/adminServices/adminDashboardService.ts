import axiosInstance from "@/src/utils/_axios";
import {
  DashboardStats,
  LowStockResponse,
  ProductAnalytics,
  SalesOverviewResponse,
  OrderResponse,
  AnalyticsParams,
} from "@/src/types";
import { AxiosError } from "axios";

class AdminDashboardService {
  private readonly baseUrl = "/api/v1/admin/analytics/";

  async getStats(): Promise<DashboardStats> {
    const response = await axiosInstance.get(`${this.baseUrl}statistics/`);
    return response.data;
  }

  async getSalesOverview(
    params: AnalyticsParams
  ): Promise<SalesOverviewResponse> {
    try {
      const response = await axiosInstance.get<SalesOverviewResponse>(
        `${this.baseUrl}sales_analytics/`,
        {
          params: {
            days: params.days || 30,
            period: params.period || "daily",
          },
        }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to fetch sales analytics:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  async getProductAnalytics(): Promise<ProductAnalytics> {
    try {
      const response = await axiosInstance.get(
        `${this.baseUrl}product_analytics/`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch product analytics:", error);
      throw error;
    }
  }

  async getCustomerAnalytics() {
    const response = await axiosInstance.get(
      `${this.baseUrl}customer_analytics/`
    );
    return response.data;
  }

  async getRecentOrders(limit: number = 5): Promise<OrderResponse> {
    const response = await axiosInstance.get("/api/v1/admin/orders/", {
      params: {
        limit,
        ordering: "-created_at",
      },
    });
    return response.data;
  }

  async getLowStockProducts(limit: number = 5): Promise<LowStockResponse> {
    const response = await axiosInstance.get("/api/v1/admin/products/", {
      params: {
        stock_status: "low",
        limit,
        ordering: "stock", // Order by lowest stock first
      },
    });
    return response.data;
  }
}

export const adminDashboardService = new AdminDashboardService();
