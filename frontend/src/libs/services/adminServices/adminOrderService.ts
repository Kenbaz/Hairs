import axiosInstance from "@/src/utils/_axios";
import { AdminOrder, OrderResponse, OrderFilters, OrderRefund } from "@/src/types";
import { AxiosError } from "axios";


class AdminOrderService {
    private readonly baseUrl = "/api/v1/admin/orders/";


    async getOrders(filters: OrderFilters = {}): Promise<OrderResponse> {
        try {
            const response = await axiosInstance.get<OrderResponse>(this.baseUrl, {
                params: {
                    ...filters,
                    search: filters.search?.trim(),
                    page_size: filters.page_size || 10,
                    page: filters.page || 1
                }
            });

            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch orders:", err.response?.data || err.message);
            throw error;
        };
    };


    async getOrder(id: number): Promise<AdminOrder> {
        try {
            const response = await axiosInstance.get<AdminOrder>(`${this.baseUrl}${id}`);

            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch order:", err.response?.data || err.message);
            throw error;
        };
    };


    async updateOrderStatus(orderId: number, status: string): Promise<AdminOrder> {
        try {
            const response = await axiosInstance.post<AdminOrder>(
                `${this.baseUrl}${orderId}/update_status/`,
                { status }
            );

            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to update order status:", err.response?.data || err.message);
            throw error;
        };
    };


    async updateTrackingNumber(orderId: number, trackingNumber: string): Promise<AdminOrder> {
        try {
            const response = await axiosInstance.patch<AdminOrder>(
                `${this.baseUrl}${orderId}/update_tracking/`,
                { tracking_number: trackingNumber }
            );

            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to update tracking number:", err.response?.data || err.message);
            throw error;
        };
    };


    async cancelOrder(orderId: number): Promise<AdminOrder> {
        try {
            const response = await axiosInstance.post<AdminOrder>(
                `${this.baseUrl}${orderId}/cancel_order/`
            );

            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to cancel order:", err.response?.data || err.message);
            throw error;
        }
    };


    async updateRefundStatus(orderId: number, refundStatus: OrderRefund['status']): Promise<AdminOrder> { 
        try {
            const response = await axiosInstance.post<AdminOrder>(
              `${this.baseUrl}${orderId}/update_order_refund/`,
              { refund_status: refundStatus }
            );

            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to update refund status:", err.response?.data || err.message);
            throw error;
        }
    }


    async downloadInvoice(orderId: number): Promise<Blob> {
        try {
            const response = await axiosInstance.get(
                `${this.baseUrl}${orderId}/invoice/`,
                { responseType: 'blob' }
            );
            if (!(response.data instanceof Blob)) {
                throw new Error('Invalid response format');
            }
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to download invoice:", err.response?.data || err.message);
            throw error;
        }
    }

};


export const adminOrderService = new AdminOrderService();