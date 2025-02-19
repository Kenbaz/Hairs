"use client";

import { PropsWithChildren } from "react";
import { useAppDispatch, useAppSelector } from "@/src/libs/_redux/hooks";
import { selectIsCartOpen, closeCart } from "@/src/libs/_redux/cartSlice";
import {
  selectIsWishlistOpen,
  closeWishlist,
} from "@/src/libs/_redux/wishlistUISlice";
import { Cart } from "../cartUI/Cart";
import { WishlistDrawer } from "../wishlistUI/WishlistDrawer";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function MainLayout({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const isCartOpen = useAppSelector(selectIsCartOpen);
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
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => dispatch(closeCart())}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md">
            <Cart />
          </div>
        </div>
      )}

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => dispatch(closeWishlist())}
      />
    </div>
  );
}
