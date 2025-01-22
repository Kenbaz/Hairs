import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import {
    ShippingRate,
    ShippingRateResponse,
    UpdateShippingRateData,
    ShippingCalculation,
    CreateShippingRateData
} from '@/src/types'


class AdminShippingService {
    private readonly baseUrl = "/api/v1/admin/shipping-rates/";

    async getShippingRates(): Promise<ShippingRateResponse> {
        try {
            const response = await axiosInstance.get<ShippingRateResponse>(
                this.baseUrl
            );
            return response.data;
        } catch (error) { 
            const err = error as AxiosError;
            console.error('Failed to fetch shipping rates', err.response?.data || err.message);
            throw error;
        }
    };


    async getShippingRate(id: number): Promise<ShippingRate> {
        try {
            const response = await axiosInstance.get<ShippingRate>(
                `${this.baseUrl}${id}`
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error('Failed to fetch shipping rate', err.response?.data || err.message);
            throw error;
        }
    };


    async createShippingRate(data: CreateShippingRateData): Promise<ShippingRate> { 
        try {
            const response = await axiosInstance.post<ShippingRate>(
                this.baseUrl,
                data
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error('Failed to create shipping rate', err.response?.data || err.message);
            throw error;
        }
    };


    async updateShippingRate(id: number, data: UpdateShippingRateData): Promise<ShippingRate> {
        try {
            const response = await axiosInstance.patch<ShippingRate>(
                `${this.baseUrl}${id}/`,
                data
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error('Failed to update shipping rate', err.response?.data || err.message);
            throw error;
        }
    };


    async deleteShippingRate(id: number): Promise<void> {
        try {
            await axiosInstance.delete(
                `${this.baseUrl}${id}/`
            );
        } catch (error) {
            const err = error as AxiosError;
            console.error('Failed to delete shipping rate', err.response?.data || err.message);
            throw error;
        }
    };


    async calculateShipping(currency: string, orderAmount: number): Promise<ShippingCalculation> {
        try {
            const response = await axiosInstance.post<ShippingCalculation>(
                `${this.baseUrl}calculate_shipping/`,
                { currency, order_amount: orderAmount }
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error('Failed to calculate shipping', err.response?.data || err.message);
            throw error;
        }
    };
};

export const adminShippingService = new AdminShippingService();