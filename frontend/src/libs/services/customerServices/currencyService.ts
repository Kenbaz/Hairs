import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import { ApiError, Currency, CurrencyConversion } from "@/src/types";


class CurrencyService {
  private readonly baseUrl = "/api/v1/currencies/";

  // Get active currencies
  async getActiveCurrencies(): Promise<Currency[]> {
    try {
      const response = await axiosInstance.get<Currency[]>(
        `${this.baseUrl}active/`
      );

      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch currencies"
      );
    }
  }

  // Convert price
  async convertPrice(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<CurrencyConversion> {
    try {
      const response = await axiosInstance.post<CurrencyConversion>(
        `${this.baseUrl}convert/`,
        {
          amount,
          from_currency: fromCurrency,
          to_currency: toCurrency,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Currency conversion failed:", error);
      // Return the original amount in the original currency if conversion fails
      return {
        amount,
        formatted: `${fromCurrency} ${amount.toFixed(2)}`,
        currency: fromCurrency,
      };
    }
  };
  
};

export const currencyService = new CurrencyService();