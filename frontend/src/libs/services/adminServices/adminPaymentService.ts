import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import { TransactionResponse, TransactionFilters, ReconciliationData, PaymentTypeForAdmin, PaymentResponseTypeForAdmin, PaymentFilters } from "@/src/types";


class AdminPaymentService {
    private readonly baseUrl = '/api/v1/admin/admin-payments';

    async getTransactionLogs(filters: TransactionFilters = {}): Promise<TransactionResponse> {
        try {
            const response = await axiosInstance.get<TransactionResponse>(
                `${this.baseUrl}/transaction_logs/`,
                { params: filters }
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch transaction logs:", err.response?.data || err.message);
            throw error;
        }
    };


    async getPaymentReconciliation(days: number = 30): Promise<ReconciliationData> {
        try {
            const response = await axiosInstance.get<ReconciliationData>(
              `${this.baseUrl}/payment_reconciliation_stats/`,
              { params: { days } }
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch payment reconciliation:", err.response?.data || err.message);
            throw error;
        }
    };


    async getPaymentDetails(id: number): Promise<PaymentTypeForAdmin> {
        try {
            const response = await axiosInstance.get<PaymentTypeForAdmin>(
                `${this.baseUrl}/${id}/`
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch payment details:", err.response?.data || err.message);
            throw error;
        }
    };


    async getAllTransactions(filters: PaymentFilters = {}): Promise<PaymentResponseTypeForAdmin> {
        try {
            const response = await axiosInstance.get<PaymentResponseTypeForAdmin>(
                this.baseUrl,
                { params: filters }
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch transactions:", err.response?.data || err.message);
            throw error;
        }
    };
};

export const adminPaymentService = new AdminPaymentService();