"use client";

import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { useRouter } from "next/navigation";
import { PriceDisplay } from "../UI/PriceDisplay";
import { Button } from "../UI/Button";

interface CartSummaryProps {
  className?: string;
}

export function CartSummary({ className = "" }: CartSummaryProps) {
  const router = useRouter();
  const { cart, isLoading } = useCartQuery();

  if (!cart || isLoading) return null;

  const handleCheckout = () => {
    router.push("/checkout");
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Subtotal</span>
          <PriceDisplay
            amount={cart.items.reduce(
              (sum, item) => sum + item.price_at_add * item.quantity,
              0
            )}
            sourceCurrency="USD"
            className="font-medium"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Shipping</span>
          {cart.shipping_fee > 0 ? (
            <PriceDisplay
              amount={cart.shipping_fee}
              sourceCurrency="USD"
              className="font-medium"
            />
          ) : (
            <span className="font-medium text-green-600">Free</span>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <PriceDisplay
              amount={
                cart.items.reduce(
                  (sum, item) => sum + item.price_at_add * item.quantity,
                  0
                ) + (cart.shipping_fee || 0)
              }
              sourceCurrency="USD"
              className="text-lg font-semibold"
            />
          </div>
        </div>

        <Button
          onClick={handleCheckout}
          disabled={cart.items.length === 0}
          className="w-full mt-6"
        >
          Proceed to Checkout
        </Button>

        {cart.items.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-2">
            Add items to your cart to proceed
          </p>
        )}
      </div>
    </div>
  );
}
