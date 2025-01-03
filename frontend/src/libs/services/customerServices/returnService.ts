import axiosInstance from "@/src/utils/_axios";
import { ReturnFormResponse, ReturnRequestForm, EligibleOrder } from "@/src/types";
import { AxiosError } from "axios";


class ReturnService {
    private readonly baseUrl = "/api/v1/customer/returns/";

    async getEligibleOrders(): Promise<EligibleOrder[]> { 
        try {
            const response = await axiosInstance.get<{ orders: EligibleOrder[] }>(
                `${this.baseUrl}eligible_orders/`
            );
            return response.data.orders;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch eligible orders:", err.response?.data || err.message);
            throw error;
        }
    };


    async submitReturnRequest(data: ReturnRequestForm): Promise<ReturnFormResponse> {
        const formData = new FormData();

        // Append basic data
        formData.append("order_id", data.order_id.toString());
        formData.append("reason", data.reason);

        // Append items as JSON string
        formData.append("items", JSON.stringify(data.items));

        // Append images
        if (data.images) {
            data.images.forEach((image) => {
                formData.append("images", image);
            });
        }

        try {
            const response = await axiosInstance.post<ReturnFormResponse>(
                `${this.baseUrl}submit_request/`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to submit return request:", err.response?.data || err.message);
            throw error;
        }
    };
};

export const returnService = new ReturnService();