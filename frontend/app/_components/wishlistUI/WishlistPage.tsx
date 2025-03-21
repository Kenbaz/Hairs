"use client";

import { useWishlistQuery } from "@/src/libs/customHooks/useWishlist";
import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { Button } from "@/app/_components/UI/Button";
import { HeartOff, ShoppingCart, Loader2, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/app/_components/UI/ConfirmModal";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PriceDisplay } from "@/app/_components/UI/PriceDisplay";
import { toast } from "react-hot-toast";

export default function WishlistPage() {
  const { items, isLoading, moveItemToCart, clear, removeItem } =
    useWishlistQuery();
  const { isItemInCart } = useCartQuery();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-10 lg:px-[3%] lg:-mt-[4%] py-5">
      <div className="grid space-y-5 2xl:mt-[2%] mb-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">My Wishlist</h1>
          <p className="text-gray-500">
            {items.length === 1 ? "1 item" : `${items.length} items`}
          </p>
        </div>

        <Button
          variant="default"
          onClick={() => setShowClearConfirm(true)}
          className="text-gray-900 border lg:ml-[70%] border-gray-900 hover:ring-1 hover:ring-black"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Wishlist
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {items.map((item) => (
          <div key={item.id} className="divide-y py-3">
            <div className="flex gap-3">
              <div className="relative h-[40%] w-[30%] sm:h-[25%] lg:h-[10.5vh] lg:landscape:h-[24vh] lg:w-[25%] lg:landscape:w-[22%] sm:w-[20%] aspect-square mb-4 xl:hidden">
                <Image
                  src={item.product.primary_image?.url}
                  alt={`${item.product.name || "Product"} Image`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="relative hidden xl:block h-[18vh] w-[18%] 2xl:w-[13%] 2xl:h-[19vh] aspect-square mb-4">
                <Image
                  src={item.product.primary_image?.url}
                  alt={`${item.product.name || "Product"} Image`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div>
                <Link href={`/shop/products/${item.product.slug}`}>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {item.product.name}
                  </h3>
                </Link>
                <div className="text-sm text-gray-500 mb-2">
                  {item.product.category.name}
                </div>

                <div className="mb-4">
                  {item.product.price_data.discount_amount ? (
                    <div className="flex items-center gap-2">
                      <PriceDisplay
                        amount={item.product.price_data.discount_amount}
                        sourceCurrency="USD"
                        className="text-gray-900 sm:text-lg font-medium"
                      />
                      <PriceDisplay
                        amount={item.product.price_data.amount}
                        sourceCurrency="USD"
                        className="text-sm sm:text-base text-gray-500 line-through"
                      />
                    </div>
                  ) : (
                    <PriceDisplay
                      amount={item.product.price_data.amount}
                      sourceCurrency="USD"
                      className="text-gray-900 sm:text-lg font-medium"
                    />
                  )}
                </div>
                <div className="gap-2 hidden sm:grid grid-cols-2">
                  <Button
                    variant="default"
                    onClick={() => handleMoveToCart(item.product.id)}
                    className="flex-1 bg-customBlack text-white"
                    disabled={
                      isItemInCart(item.product.id) ||
                      (typeof item.product.stock === "number" &&
                        item.product.stock <= 0)
                    }
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isItemInCart(item.product.id)
                      ? "Already in Cart"
                      : typeof item.product.stock === "number" &&
                        item.product.stock <= 0
                      ? "Out of Stock"
                      : "Move to Cart"}
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleRemoveItem(item.product.id)}
                    className="text-gray-900 border border-gray-900 hover:bg-customBlack hover:text-white"
                  >
                    Remove from Wishlist
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:hidden">
              <Button
                variant="default"
                onClick={() => handleMoveToCart(item.product.id)}
                className="flex-1 bg-customBlack text-white"
                disabled={
                  isItemInCart(item.product.id) ||
                  (typeof item.product.stock === "number" &&
                    item.product.stock <= 0)
                }
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {isItemInCart(item.product.id)
                  ? "Already in Cart"
                  : typeof item.product.stock === "number" &&
                    item.product.stock <= 0
                  ? "Out of Stock"
                  : "Move to Cart"}
              </Button>
              <Button
                variant="default"
                onClick={() => handleRemoveItem(item.product.id)}
                className="text-gray-900 border border-gray-900 hover:bg-customBlack hover:text-white"
              >
                Remove from Wishlist
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
