import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import { InitializePaymentData, PaymentResponse, VerifyPaymentResponse, PaymentMethodResponse } from "@/src/types";


class PaymentService {
    private readonly baseUrl = '/api/v1/payments';

    async initializePayment(data: InitializePaymentData): Promise<PaymentResponse> {
        try {
            const response = await axiosInstance.post<PaymentResponse>(
                `${this.baseUrl}/initialize/`,
                data
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Payment initialization failed:", err.response?.data || err.message);
            throw error;
        }
    };


    async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
        try {
            const response = await axiosInstance.post<VerifyPaymentResponse>(
                `${this.baseUrl}/verify/`,
                { reference }
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Payment verification failed:", err.response?.data || err.message);
            throw error;
        }
    };


    async getPaymentMethods(currency: string): Promise<PaymentMethodResponse> {
        try {
            const response = await axiosInstance.get<PaymentMethodResponse>(
                `${this.baseUrl}/methods/`,
                { params: { currency } }
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch payment methods:", err.response?.data || err.message);
            throw error;
        }
    };


    async getPaymentHistory(orderId?: number): Promise<PaymentResponse[]> {
        try {
            const response = await axiosInstance.get<PaymentResponse[]>(
                this.baseUrl,
                { params: { order_id: orderId } }
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch payment history:", err.response?.data || err.message);
            throw error;
        }
    };


    async getPaymentDetails(paymentId: number): Promise<PaymentResponse> {
        try {
            const response = await axiosInstance.get<PaymentResponse>(
                `${this.baseUrl}/${paymentId}/`
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch payment details:", err.response?.data || err.message);
            throw error;
        }
    };


    async retryPayment(paymentId: number): Promise<PaymentResponse> {
        try {
            const response = await axiosInstance.post<PaymentResponse>(
                `${this.baseUrl}/${paymentId}/retry/`
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to retry payment:", err.response?.data || err.message);
            throw error;
        }
    };
};

export const paymentService = new PaymentService();