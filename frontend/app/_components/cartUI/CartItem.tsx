"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { CartItem as CartItemType } from "@/src/types";
import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { Trash2, Minus, Plus } from "lucide-react";
import { ConfirmModal } from "../UI/ConfirmModal";
import { PriceDisplay } from "../UI/PriceDisplay";

interface CartItemProps {
  item: CartItemType;
}

export const CartItem: FC<CartItemProps> = ({ item }) => {
  const { updateCartItem, removeFromCart, isUpdatingCart } = useCartQuery();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getImageUrl = (): string => {
    if (typeof item.product.image === 'string') {
      // Guest cart case
      return item.product.image;
    }
    // Authenticated cart case
    return item.product.primary_image?.url || '';
  }

  const handleQuantityChange = async (value: number) => {
    const newQuantity = item.quantity + value;

    // Validate quantity
    if (newQuantity < 1 || newQuantity > item.product.stock) return;

    updateCartItem({
      item_id: item.id,
      quantity: newQuantity,
    });
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b">
      {/* Product Image */}
      <div className="relative w-24 h-24 flex-shrink-0">
        <Image
          src={getImageUrl()}
          alt={`${item.product.name || "Product"} Image`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover rounded-md"
        />
      </div>

      {/* Product Details */}
      <div className="flex-grow">
        <h3 className="font-medium text-gray-900">{item.product.name}</h3>

        <p className="text-sm text-gray-500">{item.product.category.name}</p>

        <div className="mt-1">
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
      </div>

      {/* Quantity Controls with Stock Warning */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={isUpdatingCart || item.quantity <= 1}
            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="h-4 w-4" />
          </button>

          <span className="w-8 text-center font-medium">{item.quantity}</span>

          <button
            onClick={() => handleQuantityChange(1)}
            disabled={isUpdatingCart || item.quantity >= item.product.stock}
            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {item.product.stock <= 5 && (
          <p className="text-xs text-orange-500">
            Only {item.product.stock} left in stock
          </p>
        )}
      </div>

      {/* Subtotal & Remove */}
      <div className="flex items-center gap-4">
        <PriceDisplay
          amount={item.quantity * item.price_at_add}
          sourceCurrency="USD"
          className="font-medium"
        />

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-full"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          removeFromCart(item.id);
          setShowDeleteConfirm(false);
        }}
        title="Remove Item"
        message="Are you sure you want to remove this item from your cart?"
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};
