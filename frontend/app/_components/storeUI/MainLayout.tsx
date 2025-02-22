"use client";

import { PropsWithChildren } from "react";
import { useAppDispatch, useAppSelector } from "@/src/libs/_redux/hooks";
import {
  selectIsWishlistOpen,
  closeWishlist,
} from "@/src/libs/_redux/wishlistUISlice";
import { WishlistDrawer } from "../wishlistUI/WishlistDrawer";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "../cartUI/CartDrawer";


export function MainLayout({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const isWishlistOpen = useAppSelector(selectIsWishlistOpen);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow border-2 border-red-800 h-screen overflow-y-auto">{children}</main>

      {/* Footer */}
      <Footer />

      {/* Cart Drawer */}
      <CartDrawer/>

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => dispatch(closeWishlist())}
      />
    </div>
  );
}
