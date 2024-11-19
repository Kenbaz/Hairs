import axiosInstance from "../../utils/_axios";
import { toast } from 'react-hot-toast';
import { AxiosError } from "axios";
import { ApiError } from "../_redux/types";


export interface PasswordResetRequest {
    email: string;
}

export interface PasswordResetConfirm {
    token: string;
    password: string;
    password_confirmation: string;
}

export interface PasswordChange {
    old_password: string;
    new_password: string;
    new_password_confirmation: string;
}

export class PasswordManager {
    static async requestReset(data: PasswordResetRequest): Promise<boolean> {
        try {
            await axiosInstance.post('/api/v1/users/reset-password/', data);
            toast.success('Password reset instructions sent to your email');
            return true;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to send reset instructions';
            toast.error(errorMessage);
            return false;
        }
    }

    static async confirmReset(data: PasswordResetConfirm): Promise<boolean> {
        try {
            await axiosInstance.post('/api/v1/users/reset-password-confirm/', data);
            toast.success('Password reset successfull');
            return true;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            const errorMessage =
              err.response?.data?.detail ||
              err.response?.data?.message ||
              "Failed to reset password";
            toast.error(errorMessage);
            return false;
        }
    }

    static async changePassword(data: PasswordChange): Promise<boolean> {
        try {
            await axiosInstance.post('/api/v1/users/change-password/', data);
            toast.success('Password changed successfully');
            return true;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            const errorMessage =
              err.response?.data?.detail ||
              err.response?.data?.message ||
              "Failed to change password";
            toast.error(errorMessage);
            return false;
        }
    }
};

