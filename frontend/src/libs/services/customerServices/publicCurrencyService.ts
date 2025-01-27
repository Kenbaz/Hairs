import axiosInstance from "@/src/utils/_axios";
import { Currency } from "@/src/types";

class PublicCurrencyService {
  private readonly baseUrl = "/api/v1/currencies";

  async getPublicCurrencies(): Promise<Currency[]> {
    try {
      const response = await axiosInstance.get<{ results: Currency[] }>(
        this.baseUrl
      );
      return response.data.results;
    } catch (error) {
      console.error("Failed to fetch currencies:", error);
      throw error;
    }
  }
}

export const publicCurrencyService = new PublicCurrencyService();