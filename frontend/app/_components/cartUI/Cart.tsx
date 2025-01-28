"use client";

import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { useAppDispatch } from "@/src/libs/_redux/hooks";
import { closeCart } from "@/src/libs/_redux/cartSlice";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { Button } from "../UI/Button";
import { ShoppingBag, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmModal } from "../UI/ConfirmModal";

export function Cart() {
  const dispatch = useAppDispatch();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { cart, isLoading, clearCart, isClearingCart } = useCartQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <ShoppingBag className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900">
          Your cart is empty
        </h2>
        <p className="text-gray-500 text-center max-w-md">
          Looks like you haven&apos;t added any items to your cart yet. Start
          shopping to fill it up!
        </p>
        <Link href="/products">
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => dispatch(closeCart())}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
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
            Shopping Cart ({cart.items.length} items)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review your items before proceeding to checkout
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowClearConfirm(true)}
            className="text-red-600 hover:bg-red-50"
            disabled={isClearingCart}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Cart
          </Button>
          <Link href="/products">
            <Button variant="outline" onClick={() => dispatch(closeCart())}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y">
              {cart.items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
            <div className="p-4 bg-gray-50 rounded-b-lg">
              <p className="text-sm text-gray-500">
                Please review your cart before proceeding to checkout. Prices
                and availability are subject to change.
              </p>
            </div>
          </div>
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <CartSummary />
          </div>
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
        message="Are you sure you want to remove all items from your cart? This action cannot be undone."
        confirmText="Clear Cart"
        variant="danger"
      />
    </div>
  );
}
