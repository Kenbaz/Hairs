'use client';

import { useState } from "react";
import Link from "next/link";
import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { ShoppingBag, ArrowRight, Trash2, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/app/_components/UI/Button";
import { ConfirmModal } from "@/app/_components/UI/ConfirmModal";
import { PriceDisplay } from "@/app/_components/UI/PriceDisplay";
import Image from "next/image";
import { CartItem } from "@/src/types";
import { ShippingFeeDisplay } from "../storeUI/ShippingFeeDisplay";
import { CartPriceDisplay } from "../UI/CartPriceDisplay";
import { useCurrency } from "../_providers/CurrencyContext";
import { useShippingFee } from "@/src/libs/customHooks/useShippingFee";


export default function CartPage() {
  const {
    cart,
    CartSummary,
    isLoading,
    updateCartItem,
    removeFromCart,
    clearCart,
    isUpdatingCart,
    isRemovingFromCart,
    isClearingCart,
  } = useCartQuery();

  const { selectedCurrency } = useCurrency();
  const {shippingFee, isCalculating: isCalculatingShipping} = useShippingFee(cart)

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);


  // Handle quantity change
  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartItem({ item_id: itemId, quantity: newQuantity });
  };

  // Handle remove item confirmation
  const handleRemoveClick = (item: CartItem) => {
    setSelectedItem(item);
    setShowRemoveConfirm(true);
  };

  // Handle remove item
  const handleRemoveItem = () => {
    if (selectedItem) {
      removeFromCart(selectedItem.id);
      setShowRemoveConfirm(false);
      setSelectedItem(null);
    }
  };

  const { subtotal } = CartSummary;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <ShoppingBag className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your cart is empty
          </h2>
          <p className="text-gray-500 mb-8">
            Looks like you haven&apos;t added any items to your cart yet.
          </p>
          <Link href="/shop/products">
            <Button size="lg">
              Continue Shopping
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setShowClearConfirm(true)}
            disabled={isClearingCart}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cart
          </Button>
          <Link href="/shop/products">
            <Button variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-8">
          <div className="bg-white shadow-sm rounded-lg divide-y">
            {cart.items.map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex items-center">
                  {/* Product Image */}
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                    <Image
                      src={
                        item.product.primary_image?.url || "/placeholder.png"
                      }
                      alt={item.product.name}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover rounded-md"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="ml-6 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">
                          {item.product.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.product.category.name}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveClick(item)}
                        disabled={isRemovingFromCart}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          disabled={isUpdatingCart || item.quantity <= 1}
                          className="p-2 hover:bg-gray-50 disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="px-4 py-2 text-center min-w-[3rem]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          disabled={
                            isUpdatingCart ||
                            item.quantity >= item.product.stock
                          }
                          className="p-2 hover:bg-gray-50 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <PriceDisplay
                          amount={item.price_at_add * item.quantity}
                          sourceCurrency="USD"
                          className="font-medium"
                        />
                        {item.quantity > 1 && (
                          <p className="text-sm text-gray-500">
                            <PriceDisplay
                              amount={item.price_at_add}
                              sourceCurrency="USD"
                            />{" "}
                            each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4 mt-8 lg:mt-0">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Order Summary
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between text-base text-gray-900">
                <span>Subtotal</span>
                <PriceDisplay
                  amount={subtotal}
                  sourceCurrency="USD"
                  className="font-medium"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-900">Shipping</span>
                {isCalculatingShipping ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : shippingFee > 0 ? (
                  <ShippingFeeDisplay
                    amount={shippingFee}
                    className="font-medium text-gray-900"
                  />
                ) : (
                  <span className="font-medium text-green-600">Free</span>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <span>Total</span>
                  <CartPriceDisplay
                    amount={subtotal}
                    sourceCurrency="USD"
                    additionalAmount={shippingFee}
                    additionalCurrency={selectedCurrency}
                    className="text-lg font-semibold text-gray-900"
                  />
                </div>
              </div>

              <div className="mt-6">
                <Link href="/checkout">
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
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

      {/* Remove Item Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveConfirm}
        onClose={() => {
          setShowRemoveConfirm(false);
          setSelectedItem(null);
        }}
        onConfirm={handleRemoveItem}
        title="Remove Item"
        message={`Are you sure you want to remove "${selectedItem?.product.name}" from your cart?`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}