'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePayment } from '../_providers/PaymentContext';
import { ModalForComponents } from '../UI/ModalForComponents';
import { Button } from '../UI/Button';
import { useCurrency } from '../_providers/CurrencyContext';
import { Loader2, Check, XCircle } from 'lucide-react';


interface PaymentModalProps { 
    isOpen: boolean;
    onClose: () => void;
    orderId: number;
    email: string;
    amount: number;
}


export function PaymentModal({ isOpen, onClose, orderId, email, amount }: PaymentModalProps) { 
    const router = useRouter();
    const { selectedCurrency } = useCurrency();
    const {
        initializePayment,
        verifyPayment,
        paymentReference,
        paymentStatus,
        isLoading,
        error,
        resetPayment
    } = usePayment();


    useEffect(() => {
        if (isOpen) {
            const callbackUrl = `${window.location.origin}/payment/callback`;
            initializePayment({
                order_id: orderId,
                payment_currency: selectedCurrency,
                email,
                callback_url: callbackUrl
            });
        }

        return () => {
            resetPayment();
        };
    }, [isOpen, orderId, email, selectedCurrency, initializePayment, resetPayment]);


    // Handle payment verification on return from paystack
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const reference = query.get('reference');

        if (reference && paymentReference === reference) {
            verifyPayment(reference)
        }
    }, [verifyPayment, paymentReference]);


    const handleClose = () => {
        resetPayment();
        onClose();
    };


    const handleRetry = () => {
        if (orderId && email) {
            const callbackUrl = `${window.location.origin}/payment/callback`;
            initializePayment({
                order_id: orderId,
                payment_currency: selectedCurrency,
                email,
                callback_url: callbackUrl
            });
        }
    };


    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-lg font-medium">
                        Processing your payment...
                    </p>
                </div>
            );
        };

        if (error) {
            return (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <XCircle className="w-12 h-12 text-red-500" />
                <p className="text-lg font-medium text-red-600">
                  Payment Error
                </p>
                <p className="text-gray-600 text-center">{error.message}</p>
                {error.type !== "RETRY_LIMIT" && (
                  <Button
                    onClick={handleRetry}
                    disabled={error.type === "RATE_LIMIT"}
                  >
                    Try Again
                  </Button>
                )}
                {error.type === "RETRY_LIMIT" && (
                  <Button onClick={() => router.push("/support")}>
                    Contact Support
                  </Button>
                )}
              </div>
            );
        };

        if (paymentStatus === "success") {
            return (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <Check className="w-12 h-12 text-green-500" />
                <p className="text-lg font-medium text-green-600">
                  Payment Successful!
                </p>
                <p className="text-gray-600">Your order has been confirmed.</p>
                <Button onClick={() => router.push("/orders")}>
                  View Orders
                </Button>
                <Button variant="outline" onClick={() => router.push("/")}>
                  Continue Shopping
                </Button>
              </div>
            );
        }

        if (paymentStatus === "failed") {
            return (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <XCircle className="w-12 h-12 text-red-500" />
                <p className="text-lg font-medium text-red-600">
                  Payment Failed
                </p>
                <p className="text-gray-600">
                  Your payment could not be processed.
                </p>
                <Button onClick={handleRetry}>Try Again</Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/checkout")}
                >
                  Return to Checkout
                </Button>
              </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <p className="text-lg font-medium">
                    Connecting to payment gateway...
                </p>
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