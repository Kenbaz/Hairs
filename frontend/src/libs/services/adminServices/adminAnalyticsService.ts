import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import { AnalyticsParams, SalesAnalyticsResponse, RevenueAnalyticsResponse, RefundReport, AnalyticsFilters } from "@/src/types";


class AdminAnalyticsService {
  private readonly baseUrl = "/api/v1/admin/analytics/";

  async getSalesAnalytics(
    params: AnalyticsParams
  ): Promise<SalesAnalyticsResponse> {
    try {
      const response = await axiosInstance.get<SalesAnalyticsResponse>(
        `${this.baseUrl}sales_analytics/`,
        { params }
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

  async getRevenueAnalytics(
    params: AnalyticsParams
  ): Promise<RevenueAnalyticsResponse> {
    try {
      const response = await axiosInstance.get<RevenueAnalyticsResponse>(
        `${this.baseUrl}revenue_analytics/`,
        { params }
      );

      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to fetch revenue analytics:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  async getRefundReport(filters: AnalyticsFilters): Promise<RefundReport> {
    try {
        const response = await axiosInstance.get<RefundReport>(
            `${this.baseUrl}refund_report/`,
            { params: filters }
        );
        return response.data;
    } catch (error) {
        const err = error as AxiosError;
        console.error(
          "Failed to fetch refund report:",
          err.response?.data || err.message
        );
        throw error;
    }
  }

  // Helper method to calculate percentage change
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }
};

export const adminAnalyticsService = new AdminAnalyticsService();