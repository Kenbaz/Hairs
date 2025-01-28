import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "./reduxTypes";

interface CartUIState {
  isCartOpen: boolean;
}

const initialState: CartUIState = {
  isCartOpen: false,
};

const cartUISlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    openCart: (state) => {
      state.isCartOpen = true;
    },
    closeCart: (state) => {
      state.isCartOpen = false;
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
  },
});

export const { openCart, closeCart, toggleCart } = cartUISlice.actions;

export const selectIsCartOpen = (state: RootState) => state.cart.isCartOpen;

export default cartUISlice.reducer;
