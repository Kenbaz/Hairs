import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "./reduxTypes";

interface WishlistUIState {
  isWishlistOpen: boolean;
}

const initialState: WishlistUIState = {
  isWishlistOpen: false,
};

const wishlistUISlice = createSlice({
  name: "wishlistUI",
  initialState,
  reducers: {
    openWishlist: (state) => {
      state.isWishlistOpen = true;
    },
    closeWishlist: (state) => {
      state.isWishlistOpen = false;
    },
    toggleWishlist: (state) => {
      state.isWishlistOpen = !state.isWishlistOpen;
    },
  },
});

export const { openWishlist, closeWishlist, toggleWishlist } =
  wishlistUISlice.actions;

export const selectIsWishlistOpen = (state: RootState) =>
  state.wishlistUI.isWishlistOpen;

export default wishlistUISlice.reducer;
