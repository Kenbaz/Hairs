import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import { User, UpdateProfileData, ApiError } from "@/src/types";
import { store } from "../../_redux/store";
import { updateUserData } from "../../_redux/authSlice";


class UserProfileService {
    private readonly baseUrl = '/api/v1/users/profile/';

    // Get user profile
    async getProfile(): Promise<User> {
        try {
            const response = await axiosInstance.get<User>(this.baseUrl);
            return response.data;
        } catch (error) {
            const err = error as AxiosError<ApiError>
            console.error('Failed to fetch profile:', err.response?.data || err.message);
            throw error;
        }
    };

    // Update user profile
    async updateProfile(data: UpdateProfileData): Promise<User> {
        try {
            const response = await axiosInstance.patch<User>(this.baseUrl, data);

            // Update user data in redux store
            store.dispatch(updateUserData(response.data));

            return response.data;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            console.error('Profile Update Failed:', err.response?.data || err.message);
            throw error;
        }
    };
};

export const userProfileService = new UserProfileService();