'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {AxiosError} from 'axios';
import { AuthState, LoginCredentials, AuthResponse, ApiError } from '../../types';
import axiosInstance from '../../utils/_axios';
import type { RootState } from './reduxTypes';
import {toast} from 'react-hot-toast';
import { notificationService } from '../services/adminServices/notificationService';
import { SessionManager } from '../auth/sessionManager';


// Helper function to safely access LocalStorage
const getStorageItem = (key: string): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
    }
    return null;
};

const initialState: AuthState = {
    user: null,
    accessToken: getStorageItem('accessToken'),
    refreshToken: getStorageItem('refreshToken'),
    isAuthenticated: Boolean(getStorageItem('accessToken')),
    isLoading: false,
    error: null,
};


// Async thunks
export const login = createAsyncThunk<AuthResponse, LoginCredentials, { rejectValue: string }>(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
           const response = await axiosInstance.post<AuthResponse>(
             "/api/v1/users/login/",
             credentials
           );

            if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', response.data.access);
                localStorage.setItem('refreshToken', response.data.refresh);
               axiosInstance.defaults.headers.common[
                 "Authorization"
               ] = `Bearer ${response.data.access}`;
            }

            // Start session manager
            SessionManager.getInstance().startSession();

            return response.data;
        } catch (error) {
            const err = error as AxiosError<ApiError>
            return rejectWithValue(
                err.response?.data?.detail || err.response?.data.message || 'Login failed'
            );
        }
    }
);


export const refreshAccessToken = createAsyncThunk<{ access: string }, void, {
    state: RootState; rejectValue: string
}>(
    'auth/refreshToken',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                // No refresh token found, initiate logout
                dispatch(logout());
                console.error('No refresh token available');
            }

           const response = await axiosInstance.post<{ access: string }>(
             "/api/v1/users/token/refresh/",
             {
               refresh: refreshToken,
             }
           );

            if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', response.data.access);
                 axiosInstance.defaults.headers.common[
                   "Authorization"
                 ] = `Bearer ${response.data.access}`;
            }

            // Reset session timeout since token has been refreshed
            SessionManager.getInstance().startSession();

            return response.data;
        } catch (error) {
            // Token refresh failed, log out user
            dispatch(logout());

            const err = error as AxiosError<ApiError>;
            return rejectWithValue(
                err.response?.data?.detail || err.response?.data?.message || 'Token refresh failed'
            );
        }
    }
);


export const logout = createAsyncThunk(
    'auth/logout',
    async () => {
        if (typeof window !== 'undefined') {
            // Get current path for redirect back after login
            const currentPath = window.location.pathname;

            // Clean up session
            SessionManager.getInstance().endSession();

            // Clear auth states
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            delete axiosInstance.defaults.headers.common['Authorization'];

            // Disconnect websocket
            notificationService.disconnect();

            // Redirect to login with return path
            const loginUrl = new URL('/admin/login', window.location.origin);
            loginUrl.searchParams.set('from', currentPath);
            window.location.href = loginUrl.toString();
        }
    }
);


export const loadUser = createAsyncThunk<
    AuthResponse['user'],
    void,
    { state: RootState, rejectValue: string }
>(
    'auth/loadUser',
    async (_, { getState, rejectWithValue }) => {
        try {
             const state = getState();
             const accessToken = state.auth.accessToken;

             if (!accessToken) {
               throw new Error("No access token found");
             }

             const response = await axiosInstance.get<AuthResponse["user"]>(
               "/api/v1/users/profile/"
             );

             // Start session management if user is successfully loaded
             SessionManager.getInstance().startSession();
             
             return {
               ...response.data,
               avatar: response.data.avatar_url || response.data.avatar || null,
               avatar_url: response.data.avatar_url || response.data.avatar || null,
             };
        } catch (error) {
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            const err = error as AxiosError<ApiError>;
            return rejectWithValue(
                err.response?.data?.detail || err.response?.data?.message || 'Failed to load user'
            );
        }
    }
);


export const updateUserData = createAsyncThunk<
  AuthResponse["user"],
  Partial<AuthResponse["user"]>,
  { state: RootState }
>("auth/updateUserData", async (userData) => {
  return userData as AuthResponse["user"];
});


const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Login cases
        builder.addCase(login.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(login.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.accessToken = action.payload.access;
            state.refreshToken = action.payload.refresh;
            state.error = null;
            toast.success('Logged in successfully');

            // Start session monitoring
            SessionManager.getInstance().startSession();
        });
        builder.addCase(login.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload ?? 'Login failed. Please check your credentials.';
            // Clear the partial auth state
            state.isAuthenticated = false;
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;

            // End session if login fails
            SessionManager.getInstance().endSession();
        });
        
        // Refresh cases
        builder.addCase(refreshAccessToken.fulfilled, (state, action) => {
            state.accessToken = action.payload.access;
            state.error = null;
        });
        builder.addCase(refreshAccessToken.rejected, (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            toast.error('Session expired. Please login again');

            // End session on refresh failure
            SessionManager.getInstance().endSession();

            // Redirect to login with current path
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                const loginUrl = new URL('/admin/login', window.location.origin);
                loginUrl.searchParams.set('from', currentPath);
                window.location.href = loginUrl.toString();
            }
        });

        // Logout cases
        builder.addCase(logout.fulfilled, (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.error = null;
            toast.success('Logged out successfully');
        });

        // Load user cases
        builder.addCase(loadUser.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(loadUser.fulfilled, (state, action) => {
            state.isLoading = false;
            state.user = action.payload;
            state.error = null;
        });
        builder.addCase(loadUser.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload ?? 'Failed to load user';

            // End session if user load fails
            SessionManager.getInstance().endSession();
        });

        // Update user cases
        builder.addCase(updateUserData.fulfilled, (state, action) => {
          if (state.user) {
            state.user = {
              ...state.user,
              ...action.payload,
            };
          }
        });
    },
});

export const { clearError } = authSlice.actions;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsAdmin = (state: RootState) => Boolean(state.auth.user?.is_staff || state.auth.user?.is_superuser);


export default authSlice.reducer;


