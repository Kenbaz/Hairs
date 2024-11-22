'use client';

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import notificationReducer from './notificationSlice'


export const store = configureStore({
    reducer: {
        auth: authReducer,
        notifications: notificationReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            // Ignore these paths in the serialization check
            ignoredActions: ['auth/login/fulfilled'],
            ignoredPaths: ['auth.user'],
        },
    }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;