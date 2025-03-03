"use client";

import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { useAppDispatch } from "@/src/libs/_redux/hooks";
import { closeCart } from "@/src/libs/_redux/cartSlice";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../UI/Button";
import { ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";
import { PriceDisplay } from "../UI/PriceDisplay";
import { useState } from "react";
import { ConfirmModal } from "../UI/ConfirmModal";

interface CartProps {
  isDrawer?: boolean;
}

export function Cart({ isDrawer = false }: CartProps) {
  const dispatch = useAppDispatch();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { cart, isLoading, clearCart, isClearingCart, CartSummary } =
    useCartQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <ShoppingBag className="h-12 w-12 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900">
          Your cart is empty
        </h2>
        <p className="text-gray-500 text-center max-w-md">
          Looks like you haven&apos;t added any items to your cart yet.
        </p>
        <Link href="/shop/products">
          <Button
            variant="outline"
            onClick={() => isDrawer && dispatch(closeCart())}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cart Header - only for drawer mode */}
      {isDrawer && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              disabled={isClearingCart}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
          <div className="text-sm">
            {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div className="flex-grow overflow-auto divide-y">
        {cart.items.map((item) => (
          <div key={item.id} className="p-4 flex items-center">
            <div className="relative h-16 w-16 flex-shrink-0">
              <Image
                src={item.product.primary_image?.url || "/placeholder.png"}
                alt={`${item.product.name || "Product"} Image`}
                fill
                sizes="64px"
                className="object-cover rounded-md"
              />
            </div>
            <div className="ml-4 flex-grow text-gray-900">
              <p className="font-medium truncate">{item.product.name}</p>
              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
            </div>
            <div className="ml-4">
              <PriceDisplay
                amount={item.price_at_add * item.quantity}
                sourceCurrency="USD"
                className="font-medium text-gray-900"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Cart Footer */}
      <div className="border-t p-4">
        <div className="flex justify-between mb-4 text-gray-900">
          <span className="font-medium">Total</span>
          <PriceDisplay
            amount={CartSummary.subtotal}
            sourceCurrency="USD"
            className="font-semibold text-gray-900"
          />
        </div>
        <div className="flex gap-2">
          <Link href="/shop/cart" className="flex-1">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => isDrawer && dispatch(closeCart())}
            >
              View Cart
            </Button>
          </Link>
          <Link href="/shop/checkout" className="flex-1">
            <Button
              className="w-full"
              onClick={() => isDrawer && dispatch(closeCart())}
            >
              Checkout
            </Button>
          </Link>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearCart();
          setShowClearConfirm(false);
        }}
        title="Clear Cart"
        message="Are you sure you want to remove all items from your cart?"
        confirmText="Clear Cart"
        variant="danger"
      />
    </div>
  );
}
