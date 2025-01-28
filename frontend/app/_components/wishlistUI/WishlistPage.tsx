"use client";

import { useWishlistQuery } from "@/src/libs/customHooks/useWishlist";
import { Button } from "@/app/_components/UI/Button";
import { HeartOff, ShoppingCart, Loader2, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/app/_components/UI/ConfirmModal";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PriceDisplay } from "@/app/_components/UI/PriceDisplay";
import { toast } from "react-hot-toast";

export default function WishlistPage() {
  const { items, isLoading, moveItemToCart, clear, removeItem } = useWishlistQuery();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

    
  const handleMoveToCart = async (productId: number) => {
    try {
      await moveItemToCart(productId);
    } catch (error) {
      console.error("Failed to move item to cart:", error);
      toast.error("Failed to move item to cart");
    }
  };

    
  const handleRemoveItem = async (productId: number) => {
    try {
      await removeItem(productId);
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error("Failed to remove item");
    }
  };

    
  const handleClearWishlist = async () => {
    try {
      await clear();
    } catch (error) {
      console.error("Failed to clear wishlist:", error);
      toast.error("Failed to clear wishlist");
    }
  };

    
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

    
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <HeartOff className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">
          Your wishlist is empty
        </h2>
        <p className="text-gray-500 text-center max-w-md">
          Items you add to your wishlist will appear here.
        </p>
        <Link href="/products">
          <Button variant="outline" className="mt-4">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

    
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            My Wishlist ({items.length} items)
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your saved items</p>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowClearConfirm(true)}
          className="text-red-600 hover:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Wishlist
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm border p-4"
          >
            <div className="relative aspect-square mb-4">
              <Image
                src={item.product.image || "/placeholder.png"}
                alt={`${item.product.name || "Product"} Image`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover rounded-md"
              />
            </div>

            <h3 className="font-medium text-gray-900 mb-1">
              {item.product.name}
            </h3>

            <div className="text-sm text-gray-500 mb-2">
              {item.product.category.name}
            </div>

            <div className="mb-4">
              {item.product.discount_price ? (
                <div className="flex items-center gap-2">
                  <PriceDisplay
                    amount={item.product.discount_price}
                    sourceCurrency="USD"
                    className="text-gray-900 font-medium"
                  />
                  <PriceDisplay
                    amount={item.product.price}
                    sourceCurrency="USD"
                    className="text-sm text-gray-500 line-through"
                  />
                </div>
              ) : (
                <PriceDisplay
                  amount={item.product.price}
                  sourceCurrency="USD"
                  className="text-gray-900 font-medium"
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleMoveToCart(item.product.id)}
                className="flex-1"
                disabled={item.product.stock <= 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {item.product.stock > 0 ? "Move to Cart" : "Out of Stock"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRemoveItem(item.product.id)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Clear Wishlist Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearWishlist}
        title="Clear Wishlist"
        message="Are you sure you want to remove all items from your wishlist? This action cannot be undone."
        confirmText="Clear Wishlist"
        variant="danger"
      />
    </div>
  );
}
