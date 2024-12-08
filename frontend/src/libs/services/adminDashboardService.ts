import axiosInstance from "@/src/utils/_axios";
import { DashboardStats, LowStockResponse, OrdersResponse, ProductAnalytics, SalesAnalytics } from "@/src/types";


class AdminDashboardService {
    async getStats(): Promise<DashboardStats> {
        const response = await axiosInstance.get('/api/v1/admin/dashboard/statistics/');
        return response.data;
    };


    async getSalesAnalytics(period: 'daily' | 'monthly', days: number = 30): Promise<SalesAnalytics> {
        const response = await axiosInstance.get('/api/v1/admin/dashboard/sales_analytics/', {
            params: { period, days }
        });
        return response.data;
    };


    async getProductAnalytics(): Promise<ProductAnalytics> {
        try {
            const response = await axiosInstance.get('/api/v1/admin/dashboard/product_analytics/');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch product analytics:', error);
            throw error;
        }
    }


    async getCustomerAnalytics() {
        const response = await axiosInstance.get('/api/v1/admin/dashboard/customer_analytics/');
        return response.data;
    };


    async getRecentOrders(limit: number = 5): Promise<OrdersResponse> {
        const response = await axiosInstance.get('/api/v1/admin/orders/', {
            params: {
                limit,
                ordering: '-created_at'
            }
        });
        return response.data;
    };


    async getLowStockProducts(limit: number = 5): Promise<LowStockResponse> {
        const response = await axiosInstance.get('/api/v1/admin/products/', {
            params: {
                stock_status: 'low',
                limit,
                ordering: 'stock' // Order by lowest stock first
            }
        });
        return response.data;
    }
};

export const adminDashboardService = new AdminDashboardService();