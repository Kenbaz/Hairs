import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import notificationReducer from "./notificationSlice";
import cartUIReducer from "./cartSlice";
import productReducer from "./productSlice";
import wishlistUIReducer from "./wishlistUISlice";


export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
    cart: cartUIReducer,
    products: productReducer,
    wishlistUI: wishlistUIReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["auth/login/fulfilled"],
        ignoredPaths: ["auth.user"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
