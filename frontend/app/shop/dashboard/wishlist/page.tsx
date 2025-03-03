"use client";

import { AuthGuard } from "@/app/_components/guards/RouteGuards";
import WishlistPage from "@/app/_components/wishlistUI/WishlistPage";

export default function WishlistRoute() {
  return (
    <AuthGuard>
      <WishlistPage />
    </AuthGuard>
  );
}
