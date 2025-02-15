"use client";

import { useState } from "react";
import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { Button } from "../UI/Button";
import { ShoppingCart, Plus, Minus } from "lucide-react";
// import { toast } from "react-hot-toast";

interface AddToCartButtonProps {
  productId: number;
  stock: number;
  className?: string;
  showQuantity?: boolean;
}

export function AddToCartButton({
  productId,
  stock,
  className = "",
  showQuantity = true,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isAddingToCart } = useCartQuery();

  const handleAddToCart = () => {
    addToCart({
      product_id: productId,
      quantity,
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
      {showQuantity && stock > 0 && (
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
        disabled={stock === 0 || isAddingToCart}
        isLoading={isAddingToCart}
        className="w-full"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {stock === 0 ? "Out of Stock" : "Add to Cart"}
      </Button>
    </div>
  );
}
