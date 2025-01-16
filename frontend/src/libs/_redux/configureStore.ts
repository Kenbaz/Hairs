import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import notificationReducer from "./notificationSlice";


export const configureAppStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      notifications: notificationReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["auth/login/fulfilled"],
          ignoredPaths: ["auth.user"],
        },
      }),
  });
};


export type AppStore = ReturnType<typeof configureAppStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
