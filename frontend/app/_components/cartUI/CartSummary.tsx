"use client";

import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { useRouter } from "next/navigation";
import { PriceDisplay } from "../UI/PriceDisplay";
import { Button } from "../UI/Button";
import { useCurrency } from "../_providers/CurrencyContext";
import { Loader2 } from "lucide-react";
import { ShippingFeeDisplay } from "../storeUI/ShippingFeeDisplay";
import { CartPriceDisplay } from "../UI/CartPriceDisplay";
import { useShippingFee } from "@/src/libs/customHooks/useShippingFee";

interface CartSummaryProps {
  className?: string;
}

export function CartSummary({ className = "" }: CartSummaryProps) {
  const router = useRouter();
  const { cart, isLoading } = useCartQuery();
  const { selectedCurrency } = useCurrency();
  const { shippingFee, isCalculating: isCalculatingShipping } = useShippingFee(cart);
  

  if (!cart || isLoading) return null;

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price_at_add * item.quantity,
    0
  );

  
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
            amount={subtotal}
            sourceCurrency="USD"
            className="font-medium text-gray-900"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Shipping</span>
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
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <CartPriceDisplay
              amount={subtotal}
              sourceCurrency="USD"
              additionalAmount={shippingFee}
              additionalCurrency={selectedCurrency}
              className="text-lg font-semibold text-gray-900"
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
