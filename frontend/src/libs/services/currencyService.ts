import axiosInstance from "@/src/utils/_axios";
import { CreateCurrencyData, Currency, CurrencyConversion, UpdateCurrencyData, CurrencyResponse } from "@/src/types";
import { AxiosError } from "axios";

interface ConversionResponse {
    amount: number;
    formatted: string;
}


class AdminCurrencyService {
  private readonly baseUrl = "/api/v1/admin/currencies";
  private readonly baseUrl2 = "/api/v1/admin/currencies/";

  // Fetch all currencies
  async getCurrencies(): Promise<Currency[]> {
    try {
      const response = await axiosInstance.get<CurrencyResponse>(this.baseUrl);
      return response.data.results;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to fetch currencies:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  // Fetch only active currencies
  async getActiveCurrencies(): Promise<Currency[]> {
    try {
      const response = await axiosInstance.get<Currency[]>(
        `${this.baseUrl}/active/`
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to fetch active currencies:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  // Create new currency
  async createCurrency(currencyData: CreateCurrencyData): Promise<Currency> {
    try {
      const response = await axiosInstance.post<Currency>(
        this.baseUrl2,
        currencyData
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to create currency:",
        err.response?.data || err.message
      );
      throw error;
    }
    }
    
    // Delete currency
    async deleteCurrency(id: number): Promise<void> { 
        try {
            await axiosInstance.delete(`${this.baseUrl2}${id}/`);
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to delete currency:", err.response?.data || err.message);
            throw error;
        }
    };

  // Convert price from one currency to another
  async convertPrice(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<CurrencyConversion> {
    try {
      const response = await axiosInstance.post<ConversionResponse>(
        `${this.baseUrl}/convert/`,
        {
          amount,
          from_currency: fromCurrency,
          to_currency: toCurrency,
        }
      );

      return {
        amount: Number(response.data.amount),
        formatted: response.data.formatted,
        currency: toCurrency,
      };
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to convert price:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  // Update currency details
  async updateCurrency(
    id: number,
    data: UpdateCurrencyData
  ): Promise<Currency> {
    try {
      const response = await axiosInstance.patch<Currency>(
        `${this.baseUrl}/${id}/`,
        {
          data,
        }
      );

      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to update currency:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  // Update currency exchange rate
  async updateExchangeRate(
    id: number,
    exchangeRate: number
  ): Promise<Currency> {
    try {
      console.log("Updating exchange rate:", { id, exchangeRate });
      const response = await axiosInstance.patch<Currency>(
        `${this.baseUrl}/${id}/update_rate/`,
        { exchange_rate: exchangeRate }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to update exchange rate:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  // Toggle currency active status
  async toggleStatus(
    id: number
  ): Promise<{ status: string; is_active: boolean }> {
    try {
      const response = await axiosInstance.post<{
        status: string;
        is_active: boolean;
      }>(`${this.baseUrl}/${id}/toggle_status/`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to toggle currency status:",
        err.response?.data || err.message
      );
      throw error;
    }
  }

  // Check if currency code exists
  async checkCurrencyExists(code: string): Promise<boolean> {
    try {
      const currencies = await this.getCurrencies();
      return currencies.some((curr) => curr.code === code.toUpperCase());
    } catch {
      return false;
    }
  }
}

export const adminCurrencyService = new AdminCurrencyService();