"use client";

import { useState } from "react";
import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { Button } from "../UI/Button";
import { ShoppingCart, Plus, Minus, Check } from "lucide-react";
import { StoreProduct } from "@/src/types";

interface AddToCartButtonProps {
  productId: number;
  stock: number;
  className?: string;
  productData: StoreProduct;
  showQuantity?: boolean;
}

export function AddToCartButton({
  productId,
  stock,
  productData,
  className = "",
  showQuantity = true,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isAddingToCart, cart } = useCartQuery();

  // Check if item exists in cart
  const cartItem = cart?.items.find((item) => item.product.id === productId);

  const isInCart = Boolean(cartItem);

  const handleAddToCart = () => {
    if (isInCart) return;

    addToCart({
      product_id: productId,
      quantity,
      productData
    });
    setQuantity(1);
  };

  const handleQuantityChange = (value: number) => {
    const newQuantity = quantity + value;
    if (newQuantity >= 1 && newQuantity <= stock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className={`grid ${className}`}>
      <div className="w-[40%]">
        {showQuantity && stock > 0 && !isInCart && (
          <div className="flex bg-customWhite p-2   border border-gray-900 items-center justify-center gap-4">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1 || isAddingToCart}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4 text-gray-900" />
            </button>

            <span className="w-12 text-center text-gray-900 font-medium">
              {quantity}
            </span>

            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= stock || isAddingToCart}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 text-gray-900" />
            </button>
          </div>
        )}
      </div>

      <Button
        variant="default"
        onClick={handleAddToCart}
        disabled={stock === 0 || isAddingToCart || isInCart}
        isLoading={isAddingToCart}
        className={`w-full mt-4 border border-gray-900 hover:ring-1 hover:ring-black rounded-none py-3 ${
          isInCart ? "font-semibold" : ""
        }`}
      >
        {isInCart ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            In Cart
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {stock === 0 ? "Out of Stock" : "Add to Cart"}
          </>
        )}
      </Button>
    </div>
  );
}
