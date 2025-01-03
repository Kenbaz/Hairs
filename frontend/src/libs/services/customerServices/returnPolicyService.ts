import axiosInstance from "@/src/utils/_axios";
import { ReturnPolicy, ProductReturnPolicy, EffectivePolicy } from "@/src/types";
import { AxiosError } from "axios";


class ReturnPolicyService {
    private readonly baseUrl = "/api/v1/return-policies/";

    async getGlobalPolicy(): Promise<ReturnPolicy> { 
        try {
            const response = await axiosInstance.get<ReturnPolicy>(
                `${this.baseUrl}current/`
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to retrieve global policy:", err.response?.data || err.message);
            throw error;
        };
    };


    async getProductPolicy(productId: number): Promise<{
        global_policy: ReturnPolicy;
        product_policy: ProductReturnPolicy | null;
        effective_policy: EffectivePolicy;
    }> {
        try {
            const response = await axiosInstance.get(
                `${this.baseUrl}product_policy/`,
                {
                    params: { product_id: productId }
                }
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to retrieve product policy:", err.response?.data || err.message);
            throw error;
        }
    };
};

export const returnPolicyService = new ReturnPolicyService();