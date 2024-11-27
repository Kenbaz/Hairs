'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios, {AxiosError} from 'axios';
import { AuthState, LoginCredentials, AuthResponse, RootState, ApiError } from '../../types';
import axiosInstance from '../../utils/_axios';
import {toast} from 'react-hot-toast';


// Helper function to safely access LocalStorage (client-side only)
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
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const refreshToken = state.auth.refreshToken;

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
            return response.data;
        } catch (error) {
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
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            delete axios.defaults.headers.common['Authorization'];
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
             return response.data;
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
        });
        builder.addCase(login.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload ?? 'Login failed. Please check your credentials.';
            // Clear the partial auth state
            state.isAuthenticated = false;
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
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


