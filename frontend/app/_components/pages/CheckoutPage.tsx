'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartQuery } from "@/src/libs/customHooks/useCart";
import { useAuth } from "@/src/libs/customHooks/useAuth";
import { Alert } from "@/app/_components/UI/Alert";
import { Button } from "@/app/_components/UI/Button";
import { PriceDisplay } from "@/app/_components/UI/PriceDisplay";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  MapPin,
  Check,
  Loader2,
} from "lucide-react";
import { CartItem } from "@/src/types";
import Image from "next/image";
import Link from "next/link";
import { PaymentModal } from "../PaymentsUI/PaymentModal";
import ShippingAddressForm from "../userRegistration/ShippingAddressForm";
import { useAppDispatch } from "@/src/libs/_redux/hooks";
import { loadUser } from "@/src/libs/_redux/authSlice";
import { useShippingFee } from "@/src/libs/customHooks/useShippingFee";
import { ShippingFeeDisplay } from "../storeUI/ShippingFeeDisplay";
import { CartPriceDisplay } from "../UI/CartPriceDisplay";
import { useCurrency } from "../_providers/CurrencyContext";


enum CheckoutStep {
    REVIEW = 'review',
    SHIPPING = 'shipping',
    PAYMENT = 'payment',
    CONFIRMATION = 'confirmation',
}


export default function CheckoutPage() { 
    const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.REVIEW);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const { cart, CartSummary, isLoading } = useCartQuery();
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const searchParams = useSearchParams();
    const { selectedCurrency } = useCurrency();
    
    const { shippingFee, isCalculating: isCalculatingShipping } =
      useShippingFee(cart);


    // Handle payment status from callback
    useEffect(() => {
      const status = searchParams.get("status");
      const errorMessage = searchParams.get("error");

      if (status === "success") {
        setCurrentStep(CheckoutStep.CONFIRMATION);
        setPaymentError(null);
      } else if (status === "error") {
        setCurrentStep(CheckoutStep.PAYMENT);
        setPaymentError(errorMessage || "Payment failed. Please try again.");
      }
    }, [searchParams]);
  
  
    useEffect(() => {
      if (isAuthenticated && !user) {
        dispatch(loadUser());
      }
    }, [isAuthenticated, user, dispatch]);


    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login?from=/shop/checkout');
        }
    }, [isAuthenticated, router]);


    // Redirect if cart is empty
    if (!isLoading && (!cart || cart.items.length === 0)) {
        router.push('/shop/cart');
        return null;
    }

    if (isLoading) {
        return (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
          </div>
        );
    }

    const hasShippingInfo = Boolean(user?.address && user?.city && user?.state && user?.country);

      console.log('hasShippingInfo:', hasShippingInfo);


    const renderStepIndicator = () => (
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {Object.values(CheckoutStep).map((step) => (
            <div
              key={step}
              className={`flex items-center ${
                currentStep === step ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep === step
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300"
                }`}
              >
                {step === CheckoutStep.REVIEW && "1"}
                {step === CheckoutStep.SHIPPING && "2"}
                {step === CheckoutStep.PAYMENT && "3"}
                {step === CheckoutStep.CONFIRMATION && "4"}
              </div>
              <span className="ml-2 hidden sm:inline">
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );

    const renderCartReview = () => (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Review Your Cart</h2>
        <div className="divide-y">
          {cart?.items.map((item: CartItem) => (
            <div key={item.id} className="py-4 flex items-center">
              <div className="relative h-20 w-20 flex-shrink-0">
                <Image
                  src={item.product.primary_image?.url || ""}
                  alt={item.product.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover rounded-md"
                />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-medium">{item.product.name}</h3>
                <p className="text-sm text-gray-500">
                  Quantity: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <PriceDisplay
                  amount={item.price_at_add * item.quantity}
                  sourceCurrency="USD"
                  className="font-medium"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <PriceDisplay amount={CartSummary.subtotal} sourceCurrency="USD" />
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
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <CartPriceDisplay
              amount={CartSummary.subtotal}
              sourceCurrency="USD"
              additionalAmount={shippingFee}
              additionalCurrency={selectedCurrency}
              className="text-lg font-semibold text-gray-900"
            />
          </div>
        </div>
      </div>
    );

    const renderShippingReview = () => {
      if (!hasShippingInfo) {
        return <ShippingAddressForm />;
      }

      return (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Shipping Information</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-400 mt-1" />
              <div className="ml-3">
                <p className="text-gray-900">{user?.address}</p>
                <p className="text-gray-600">
                  {user?.city}, {user?.state}
                </p>
                <p className="text-gray-600">{user?.country}</p>
                <p className="text-gray-600">{user?.postal_code}</p>
              </div>
            </div>
          </div>
        </div>
      );
    };

    const renderConfirmation = () => (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold">Order Confirmed!</h2>
        <p className="text-gray-600">
          Thank you for your order. We&apos;ll send you a confirmation email shortly.
        </p>
        <div className="pt-6">
          <Link href="/orders">
            <Button>View Order</Button>
          </Link>
        </div>
      </div>
    );

    const renderCurrentStep = () => {
      const content = (() => {
        switch (currentStep) {
          case CheckoutStep.REVIEW:
            return renderCartReview();
          case CheckoutStep.SHIPPING:
            return renderShippingReview();
          case CheckoutStep.PAYMENT:
            return (
              <div className="space-y-6">
                {paymentError && (
                  <Alert type="error" message={paymentError} className="mb-6" />
                )}
                {renderCartReview()}{" "}
              </div>
            );
          case CheckoutStep.CONFIRMATION:
            return renderConfirmation();
          default:
            return null;
        }
      })();

      return content;
    };

    const handleNext = () => {
        const steps = Object.values(CheckoutStep);
        const currentIndex = steps.indexOf(currentStep);

        if (currentStep === CheckoutStep.SHIPPING && !hasShippingInfo) {
            console.log('current step is shipping and has no shipping info');
            return;
        }

        if (currentStep === CheckoutStep.PAYMENT) {
            setShowPaymentModal(true);
            return;
        }

        if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1]);
        }
    };

    const handleBack = () => {
        const steps = Object.values(CheckoutStep);
        const currentIndex = steps.indexOf(currentStep);
        
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1]);
        }
    };


    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {renderStepIndicator()}

        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderCurrentStep()}

          {currentStep !== CheckoutStep.CONFIRMATION && (
            <div className="mt-8 flex justify-between">
              {currentStep !== CheckoutStep.REVIEW ? (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              ) : (
                <Link href="/cart">
                  <Button variant="outline">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Back to Cart
                  </Button>
                </Link>
              )}

              <Button onClick={handleNext}>
                {currentStep === CheckoutStep.PAYMENT
                  ? "Place Order"
                  : "Continue"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          email={user?.email || ""}
          amount={CartSummary.total}
        />
      </div>
    );
}