import axiosInstance from "@/src/utils/_axios";
import { ReturnRequest, ReturnResponse, ReturnFiltersType } from "@/src/types";
import { AxiosError } from "axios";


class AdminReturnService {
    private readonly baseUrl = "/api/v1/admin/returns/";

    async getReturns(filters: ReturnFiltersType = {}): Promise<ReturnResponse> {
        try {
            const response = await axiosInstance.get<ReturnResponse>(this.baseUrl, {
            params: filters
            });
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch return requests:", err.response?.data || err.message);
            throw error;
        }   
    };


    async getReturn(id: number): Promise<ReturnRequest> {
        try {
             const response = await axiosInstance.get<ReturnRequest>(`${this.baseUrl}${id}/`);
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch return request:", err.response?.data || err.message);
            throw error;
        }
    };
    

    async updateStatus(
        id: number,
        status: ReturnRequest['return_status'],
        notes?: string
    ): Promise<ReturnRequest> {
        try {
            const response = await axiosInstance.patch<ReturnRequest>(
                `${this.baseUrl}${id}/update_status/`,
                { status, notes }
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
                console.error("Failed to update refund status:", err.response?.data || err.message);
                throw error;
        }
    };
    

    async updateRefund(
        id: number,
        refund_status: ReturnRequest['refund_status'],
        refund_amount?: number
    ): Promise<ReturnRequest> {
        try {
            const response = await axiosInstance.patch<ReturnRequest>(
                `${this.baseUrl}${id}/update_refund/`,
                { refund_status, refund_amount }
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to update refund status:", err.response?.data || err.message);
            throw error;
        }
    };
};

export const adminReturnService = new AdminReturnService();