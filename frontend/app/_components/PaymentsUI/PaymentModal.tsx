"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePayment } from "../_providers/PaymentContext";
import { ModalForComponents } from "../UI/ModalForComponents";
import { Button } from "../UI/Button";
import { useCurrency } from "../_providers/CurrencyContext";
import { Loader2, Check, XCircle } from "lucide-react";
import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { useAuth } from "@/src/libs/customHooks/useAuth";
import { orderService } from "@/src/libs/services/customerServices/orderService";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: number;
  email: string;
  amount: number;
}

export function PaymentModal({
  isOpen,
  onClose,
  orderId,
  email,
  amount,
}: PaymentModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { cart } = useCartQuery();
  const { selectedCurrency } = useCurrency();

  // Using a ref to track the created order ID to avoid unnecessary renders
  const createdOrderIdRef = useRef<number | undefined>(orderId);

  // Payment hook from context
  const {
    initializePayment,
    verifyPayment,
    paymentReference,
    paymentStatus,
    isLoading,
    error,
    resetPayment,
  } = usePayment();

  // Track if we've already initialized payment to prevent multiple calls
  const hasInitializedRef = useRef(false);

  // Effect to create order and initialize payment once when modal opens
  useEffect(() => {
    // Only run this once when the modal opens
    if (isOpen && !hasInitializedRef.current) {
      const createOrderAndInitPayment = async () => {
        try {
          // Use existing order ID if available
          let orderIdToUse = createdOrderIdRef.current || orderId;

          // Only create a new order if no order exists yet
          if (!orderIdToUse && cart && user) {
            // Format user shipping address
            const shippingAddress =
              user.address && user.city && user.state && user.country
                ? `${user.address}, ${user.city}, ${user.state}, ${user.country}`
                : "Missing shipping address";

            // Create order
            const orderResponse = await orderService.createOrder({
              shipping_address: shippingAddress,
              items: cart.items.map((item) => ({
                product_id: item.product.id,
                quantity: item.quantity,
              })),
            });

            orderIdToUse = orderResponse.id;
            // Store the ID in the ref to avoid re-renders
            createdOrderIdRef.current = orderIdToUse;
          }

          if (!orderIdToUse) {
            console.error("No valid order ID available for payment");
            return;
          }

          const callbackUrl = `${window.location.origin}/shop/payment/callback`;

          // Initialize payment
          await initializePayment({
            order_id: orderIdToUse,
            payment_currency: selectedCurrency,
            email,
            amount,
            callback_url: callbackUrl,
          });

          // Mark as initialized to prevent duplicate calls
          hasInitializedRef.current = true;
        } catch (error) {
          console.error("Payment initialization failed:", error);
        }
      };

      createOrderAndInitPayment();
    }

    // Reset when modal closes
    return () => {
      if (!isOpen) {
        resetPayment();
        hasInitializedRef.current = false;
      }
    };
  }, [isOpen, initializePayment, selectedCurrency, email, amount, cart, user, orderId, resetPayment]);

  // Handle payment verification separate from initialization logic
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const reference = query.get("reference");

    if (reference && paymentReference === reference) {
      verifyPayment(reference);
    }
  }, [verifyPayment, paymentReference]);

  const handleClose = () => {
    resetPayment();
    hasInitializedRef.current = false;
    onClose();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-lg text-gray-900 font-medium">
            Processing your payment...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <XCircle className="w-12 h-12 text-red-500" />
          <p className="text-lg font-medium text-red-600">Payment Error</p>
          <p className="text-gray-600 text-center">{error.message}</p>
          <Button onClick={() => router.push("/support")}>
            Contact Support
          </Button>
        </div>
      );
    }

    if (paymentStatus === "success") {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <Check className="w-12 h-12 text-green-500" />
          <p className="text-lg font-medium text-green-600">
            Payment Successful!
          </p>
          <p className="text-gray-600">Your order has been confirmed.</p>
          <Button onClick={() => router.push("/orders")}>View Orders</Button>
          <Button
            variant="outline"
            onClick={() => router.push("/shop/products")}
          >
            Continue Shopping
          </Button>
        </div>
      );
    }

    if (paymentStatus === "failed") {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <XCircle className="w-12 h-12 text-red-500" />
          <p className="text-lg font-medium text-red-600">Payment Failed</p>
          <p className="text-gray-600">Your payment could not be processed.</p>
          <Button onClick={() => router.push("/shop/checkout")}>
            Return to Checkout
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-lg font-medium">Connecting to payment gateway...</p>
        <p className="text-gray-600">Please wait while we redirect you.</p>
      </div>
    );
  };

  return (
    <ModalForComponents
      isOpen={isOpen}
      onClose={handleClose}
      showCloseButton={paymentStatus !== "pending"}
    >
      <div className="relative">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Payment</h2>
          <p className="text-gray-600 mb-6">
            Amount: {selectedCurrency} {amount.toFixed(2)}
          </p>
        </div>
        {renderContent()}
      </div>
    </ModalForComponents>
  );
}
