import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { NotificationState, AdminNotification, ApiError } from "./types";
import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";


const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
};


// Async thunk
export const fetchNotifications = createAsyncThunk('notifications/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get<AdminNotification[]>('/api/v1/admin/notifications/');
            return response.data;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            return rejectWithValue(
                err.response?.data?.detail ||
                err.response?.data.message ||
                "Failed to fetch notifications"
            );
        };
    }
);


export const markAsRead = createAsyncThunk('notifications/markAsRead',
    async (notificationId: string, { rejectWithValue }) => {
        try {
            await axiosInstance.post(`api/v1/admin/notifications/${notificationId}/mark-read/`);
            return notificationId;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            return rejectWithValue(err.response?.data?.detail || err.response?.data?.message || 'Failed to mark notification as read');
        };
    }
);


export const markAllAsRead = createAsyncThunk('notification/markAllAsRead',
    async (_, { rejectWithValue }) => {
        try {
            await axiosInstance.post('api/v1/admin/notifications/mark-all-read/');
            return true;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            return rejectWithValue(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                "Failed to mark notification as read"
            );
        };
    }
);


const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action) => {
            state.notifications.unshift(action.payload);
            if (!action.payload.is_read) {
                state.unreadCount += 1;
            }
        },
        clearNotifications: (state) => {
            state.notifications = [];
            state.unreadCount = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.isLoading = false;
                state.notifications = Array.isArray(action.payload) ? action.payload : [];
                state.unreadCount = state.notifications.filter(n => !n.is_read).length;
                state.error = null;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { addNotification, clearNotifications } = notificationSlice.actions;


// Selectors
export const selectNotifications = (state: RootState) => state.notifications.notifications;
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount;
export const selectIsLoading = (state: RootState) => state.notifications.isLoading;

export default notificationSlice.reducer;