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
    <div className={`flex flex-col gap-4 ${className}`}>
      {showQuantity && stock > 0 && !isInCart && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1 || isAddingToCart}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="h-4 w-4" />
          </button>

          <span className="w-12 text-center font-medium">{quantity}</span>

          <button
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= stock || isAddingToCart}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      <Button
        onClick={handleAddToCart}
        disabled={stock === 0 || isAddingToCart || isInCart}
        isLoading={isAddingToCart}
        className={`w-full ${
          isInCart ? "bg-green-600 hover:bg-green-700" : ""
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
