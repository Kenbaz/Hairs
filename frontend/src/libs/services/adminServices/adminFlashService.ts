import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import { FlashSale, FlashSaleFilters, FlashSaleStats, FlashSaleProducts, CustomerPurchase, FlashSaleResponse, AvailableProduct } from "@/src/types";


class AdminFlashSaleService {
  private readonly baseUrl = "/api/v1/admin/flash-sales/";

  async getFlashSales(filters: FlashSaleFilters = {}): Promise<FlashSaleResponse> {
    try {
      console.log('Flash sale service', filters)
      const response = await axiosInstance.get<FlashSaleResponse>(`${this.baseUrl}`, {
        params: filters,
      });
      console.log('response', response.data)
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to fetch flash sales:",
        err.response?.data || err.message
      );
      throw error;
    }
  };

  async getFlashSale(id: number): Promise<FlashSale> {
    try {
      const response = await axiosInstance.get<FlashSale>(
        `${this.baseUrl}${id}/`
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to fetch flash sale:",
        err.response?.data || err.message
      );
      throw error;
    }
  };
  
  async createFlashSale(data: Partial<FlashSale>): Promise<FlashSale> {
    console.log('Creating a flash sale')
    try {
        console.log("Sending flash sale data:", data);
        const response = await axiosInstance.post<FlashSale>(this.baseUrl, data);
        console.log('Response', response.data)
        return response.data
    } catch (error) {
        const err = error as AxiosError;
        console.error(
          "Failed to create flash sale:",
          err.response?.data || err.message
        );
        throw error;
    }
  };
  
  async updateFlashSale(data: {id: number} & Partial<FlashSale>): Promise<FlashSale> {
    try {
        const { id, ...updateData } = data;
        const response = await axiosInstance.put<FlashSale>(
            `${this.baseUrl}${id}/`,
            updateData
        );
        return response.data;
    } catch (error) {
        const err = error as AxiosError;
        console.error(
          "Failed to update flash sale:",
          err.response?.data || err.message
        );
        throw error;
    }
  };
  
  async deleteFlashSale(id: number): Promise<void> {
    try {
        await axiosInstance.delete(`${this.baseUrl}${id}/`);
    } catch (error) {
        const err = error as AxiosError;
        console.error(
          "Failed to delete flash sale:",
          err.response?.data || err.message
        );
        throw error;
    }
  };
  
  async updateStatus(id: number, status: string): Promise<FlashSale> {
    try {
      const response = await axiosInstance.post<FlashSale>(
        `${this.baseUrl}${id}/update_status/`,
        { status }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error("Failed to update status:", err.response?.data || err.message);
      throw error;
    }
  }

  async getStatistics(id: number): Promise<FlashSaleStats> {
    try {
      const response = await axiosInstance.get<FlashSaleStats>(
        `${this.baseUrl}${id}/flash_sale_statistics/`
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error("Failed to fetch statistics:", err.response?.data || err.message);
      throw error;
    }
  }

  async getCustomerPurchases(id: number): Promise<CustomerPurchase[]> {
    try {
      const response = await axiosInstance.get<CustomerPurchase[]>(
        `${this.baseUrl}${id}/customer_purchases/`
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error("Failed to fetch customer purchases:", err.response?.data || err.message);
      throw error;
    }
  }

  async updateProducts(id: number, products: FlashSaleProducts[]): Promise<FlashSale> {
    try {
      const response = await axiosInstance.patch<FlashSale>(
        `${this.baseUrl}${id}/update_products/`,
        { products }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error("Failed to update products:", err.response?.data || err.message);
      throw error;
    }
  }

  async getAvailableProducts(): Promise<AvailableProduct[]> {
    try {
      const response = await axiosInstance.get<AvailableProduct[]>(
        `${this.baseUrl}available_products/`
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error("Failed to fetch available products:", err.response?.data || err.message);
      throw error;
    }
  }
}

export const adminFlashSaleService = new AdminFlashSaleService();