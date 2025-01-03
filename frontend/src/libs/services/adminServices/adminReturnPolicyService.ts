import axiosInstance from "@/src/utils/_axios";
import { ReturnPolicy, ProductReturnPolicy, CreateProductPolicyData, PolicyResponse } from "@/src/types";
import { AxiosError } from "axios";


class AdminReturnPolicyService {
  private readonly baseUrl = "/api/v1/admin/return-policies/";

  async createGlobalPolicy(data: ReturnPolicy): Promise<ReturnPolicy> {
    try {
      const response = await axiosInstance.post<ReturnPolicy>(
        `${this.baseUrl}create_global_policy/`,
        data
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to create global policy:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  async createProductPolicy(
    data: CreateProductPolicyData
  ): Promise<ProductReturnPolicy> {
    try {
      const response = await axiosInstance.post<ProductReturnPolicy>(
        `${this.baseUrl}create_product_policy/`,
        data
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to create product policy:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  async getPolicies(): Promise<PolicyResponse> {
    try {
      const response = await axiosInstance.get<PolicyResponse>(this.baseUrl);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to retrieve policies:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  async getProductPolicies(): Promise<ProductReturnPolicy[]> {
    try {
      const response = await axiosInstance.get<ProductReturnPolicy[]>(
        `${this.baseUrl}product_policies/`
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to retrieve product policies:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  async getProductPolicy(productId: number): Promise<ProductReturnPolicy[]> {
    try {
      const response = await axiosInstance.get<ProductReturnPolicy[]>(
        `${this.baseUrl}product_policies/${productId}/`
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to retrieve product policies:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  async updateGlobalPolicy(data: Partial<ReturnPolicy>): Promise<ReturnPolicy> {
    try {
      const response = await axiosInstance.patch<ReturnPolicy>(
        `${this.baseUrl}global_policy/`,
        data
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to update global policy:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  async updateProductPolicy(
    id: number,
    data: Partial<ProductReturnPolicy>
  ): Promise<ProductReturnPolicy> {
    try {
      const response = await axiosInstance.patch<ProductReturnPolicy>(
        `${this.baseUrl}update_product_policy/${id}/`,
        data
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to update product policy:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  async deleteProductPolicy(productId: number): Promise<void> {
    try {
      await axiosInstance.delete(`${this.baseUrl}delete_product_policy/`, {
        params: { product_id: productId },
      });
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to delete product policy:",
        err.response?.data || err.message
      );
      throw error;
    }
  }
};

export const adminReturnPolicyService = new AdminReturnPolicyService();