import axiosInstance from "@/src/utils/_axios";
import { AdminUser, UserFilters, UserResponse, PurchaseHistory } from "@/src/types";
import { AxiosError} from "axios";


class AdminUserService {
    private readonly baseUrl = "/api/v1/admin/users/";

    async getUsers(filters: UserFilters = {}): Promise<UserResponse> {
        try {
            const response = await axiosInstance.get<UserResponse>(this.baseUrl, {
                params: {
                    ...filters,
                    search: filters.search?.trim(),
                    page_size: filters.page_size || 10,
                    page: filters.page || 1,
                }
            });

            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch users:", err.response?.data || err.message);
            throw error;
        }
    };


    async getUser(id: number): Promise<AdminUser> {
        try {
            const response = await axiosInstance.get<AdminUser>(
                `${this.baseUrl}${id}/`
            );

            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch user:", err.response?.data || err.message);
            throw error;
        }
    };


    async toggleUserStatus(id: number): Promise<AdminUser> {
        try {
            const response = await axiosInstance.post<AdminUser>(
                `${this.baseUrl}${id}/toggle_active/`
            );

            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to toggle user status:", err.response?.data || err.message);
            throw error;
        }
    };


    async getPurchaseHistory(id: number): Promise<PurchaseHistory> {
        try {
            const response = await axiosInstance.get<PurchaseHistory>(
                `${this.baseUrl}${id}/purchase_history/`
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Failed to fetch purchase history:", err.response?.data || err.message);
            throw error;
        }
    }
};

export const adminUserService = new AdminUserService();