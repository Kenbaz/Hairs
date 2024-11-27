import axiosInstance from "../../utils/_axios";
import { toast } from 'react-hot-toast';
import { AxiosError } from "axios";
import { ApiError } from "../../types";


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
            // Split the token only on the first occurrence of '-'
            const [uidb64, token] = data.token.split(/-(.+)/);
            
            const payload = {
                uidb64,
                token,
                password: data.password,
                password_confirmation: data.password_confirmation
            };

            console.log('Debug - Sending reset request with:', {
                ...payload,
                password: '***hidden***',
                password_confirmation: '***hidden***'
            });

            const response = await axiosInstance.post(
                '/api/v1/users/reset-password-confirm/',
                payload
            );

            if (response.data?.message) {
                toast.success(response.data.message);
                return true;
            }

            return false;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            console.error('Reset error:', {
                status: err.response?.status,
                data: err.response?.data,
                error: err.message
            });
            
            const errorMessage = 
                // err.response?.data?.errors || 
                // err.response?.data?.detail || 
                // err.response?.data?.message || 
                'Failed to reset password. Please try again.';
            
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

