import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import { UserRegisterData, VerifyEmailResponse, PasswordResetRequestData, PasswordRequestConfirmData, ChangePasswordData, UpdateProfileData } from "@/src/types";


class UserAuthService {
    private readonly baseUrl = '/api/v1/users';

    // Register new user
    async registerUser(data: UserRegisterData): Promise<void> {
        try {
          const response = await axiosInstance.post(`${this.baseUrl}/register/`, data);
          return response.data;
        } catch (error) {
            const err = error as AxiosError;
            console.error("Full Registration Error:", {
              status: err.response?.status,
              data: err.response?.data,
              headers: err.response?.headers,
            });
            throw error;
        }
    };

    // Verify email
    async verifyEmail(data: { token: string }): Promise<VerifyEmailResponse> {
    try {
      const response = await axiosInstance.post(
        `${this.baseUrl}/verify-email/`, 
        data
      );
      
      if (response.data.tokens) {
        localStorage.setItem('accessToken', response.data.tokens.access);
        localStorage.setItem('refreshToken', response.data.tokens.refresh);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.tokens.access}`;
      }

      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(err.response?.data || 'Email verification failed');
      throw error;
    }
  }

    // Request password reset
    async requestPasswordReset(data: PasswordResetRequestData): Promise<void> { 
        try {
            await axiosInstance.post(`${this.baseUrl}/password-reset/`, data);
        } catch (error) {
            const err = error as AxiosError;
            console.error(
              "Password Reset Request Failed:",
              err.response?.data || err.message
            );
            throw error;
        }
    };

    // Confirm password reset
    async confirmPasswordReset(data: PasswordRequestConfirmData): Promise<void> {
        try {
            await axiosInstance.post(`${this.baseUrl}/reset-password-confirm/`, data);
        } catch (error) {
            const err = error as AxiosError;
            console.error(
              "Password Reset Confirmation Failed:",
              err.response?.data || err.message
            );
            throw error;
        }
    };

    // Change password
    async changePassword(data: ChangePasswordData): Promise<void> {
        try {
            await axiosInstance.post(`${this.baseUrl}/change-password/`, data);
        } catch (error) {
            const err = error as AxiosError;
            console.error(
              "Password Change Failed:",
              err.response?.data || err.message
            );
            throw error;
        }
    };

    // Update user profile
    async updateProfile(data: UpdateProfileData): Promise<void> {
        try {
            await axiosInstance.patch(`${this.baseUrl}/profile/`, data);
        } catch (error) {
            const err = error as AxiosError;
            console.error(
              "Profile Update Failed:",
              err.response?.data || err.message
            );
            throw error;
        }
    };

    // Request new email verification
    async sendVerificationEmail(): Promise<void> { 
        try {
            await axiosInstance.post(`${this.baseUrl}/send-verification-email/`);
        } catch (error) {
            const err = error as AxiosError;
            console.error(
              "Email Verification Request Failed:",
              err.response?.data || err.message
            );
            throw error;
        }
    };
};

export const userAuthService = new UserAuthService();