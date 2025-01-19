"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePayment } from "../_providers/PaymentContext";
import { Loader2 } from "lucide-react";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyPayment } = usePayment();

  useEffect(() => {
    const handlePaymentVerification = async () => {
      const reference = searchParams.get("reference");

      if (!reference) {
        router.push("/checkout?status=error");
        return;
      }

      try {
        await verifyPayment(reference);
        // Redirect back to checkout/orders with success status
        router.push("/checkout?status=success");
      } catch (error) {
        // Redirect back to checkout with error status
        router.push("/checkout?status=error");
        console.error("Payment verification failed:", error);
      }
    };

    handlePaymentVerification();
  }, [searchParams, verifyPayment, router]);

  // Show minimal loading state while verifying
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
      <p className="text-gray-600">Verifying payment...</p>
    </div>
  );
}
