import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import { ShippingFeeCalculation, ShippingRate, ShippingRateResponse } from "@/src/types";


class ShippingService {
  private readonly baseUrl = "/api/v1/shipping/";

  // Get all shipping rates
  async getShippingRates(): Promise<ShippingRate[]> {
    try {
      const response = await axiosInstance.get<ShippingRateResponse>(
        `${this.baseUrl}rates/`
        );
      return response.data.results;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to fetch shipping rates:",
        err.response?.data || err.message
      );
      return [];
    }
  }

  // Calculate shipping for given currency and order amount
  async calculateShippingFee(
    currency: string,
    orderAmount: number
  ): Promise<ShippingFeeCalculation> {
    try {
      const response = await axiosInstance.post<ShippingFeeCalculation>(
        `${this.baseUrl}rates/calculate/`,
        {
          currency,
          order_amount: orderAmount,
        }
        );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to calculate shipping:",
        err.response?.data || err.message
      );

      // Return a default calculation with zero shipping in case of error
      return {
        currency,
        order_amount: orderAmount,
        shipping_fee: 0,
        total_amount: orderAmount,
      };
    }
  }
}

export const shippingService = new ShippingService();