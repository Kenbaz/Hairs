import axiosInstance from "@/src/utils/_axios";
import { User } from "@/src/types";
import { AxiosError } from "axios";

class AdminProfileService {
  private readonly baseUrl = "/api/v1/users/admin/profile/";

  async updateProfile(data: FormData): Promise<User> {
        try {
            const response = await axiosInstance.patch<User>(
                this.baseUrl,
                data,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error(
                "Failed to update profile:",
                err.response?.data || err.message
            );
            throw error;
        }
    }


  async getProfile(): Promise<User> {
    try {
      const response = await axiosInstance.get<User>(this.baseUrl);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Failed to fetch profile:",
        err.response?.data || err.message
      );
      throw error;
    }
  }
}

export const adminProfileService = new AdminProfileService();
