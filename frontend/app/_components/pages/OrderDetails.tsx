"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/src/libs/services/customerServices/orderService";
import {
  Loader2,
  PackageCheck,
  ArrowLeft,
  Copy,
  CheckCircle2,
  ShoppingCart,
} from "lucide-react";
import { PriceDisplay } from "../UI/PriceDisplay";
import { Button } from "../UI/Button";
import { Alert } from "../UI/Alert";
import Image from "next/image";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { OrderStatusTracker } from "../storeUI/OrderStatusTracker";
import { CancelOrderButton } from "../storeUI/CancelOrderButton";
import { CustomerOrder } from "@/src/types";
import { useCurrency } from "../_providers/CurrencyContext";

interface OrderDetailProps {
  orderId: number;
}

export function OrderDetail({ orderId }: OrderDetailProps) {
  const [copied, setCopied] = useState(false);
  const { selectedCurrency } = useCurrency();

  const {
    data: order,
    isLoading,
    error,
  } = useQuery<CustomerOrder>({
    queryKey: ["user-order", orderId],
    queryFn: () => orderService.getOrderDetails(orderId),
  });

  const copyTrackingNumber = () => {
    if (order?.tracking_number) {
      navigator.clipboard.writeText(order.tracking_number);
      setCopied(true);
      toast.success("Tracking number copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo: Record<string, { color: string; message: string }> = {
      pending: {
        color: "text-yellow-800",
        message: "Your order has been received and is awaiting processing",
      },
      processing: {
        color: "text-blue-800",
        message: "We're preparing your items for shipment",
      },
      shipped: {
        color: "text-purple-800",
        message: "Your order is on its way to you",
      },
      delivered: {
        color: "text-green-800",
        message: "Your order has been delivered successfully",
      },
      cancelled: {
        color: "text-red-800",
        message: "This order has been cancelled",
      },
    };

    const { color, message } = statusInfo[status] || {
      color: "bg-gray-100 text-gray-800",
      message: "Status unknown",
    };

    return (
      <div className="flex flex-col items-start">
        <span className={`py-1 rounded-full text-sm font-medium ${color}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <span className="text-sm text-gray-600 mt-2">{message}</span>
      </div>
    );
  };

  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <Alert
        type="error"
        message="There was an error loading this order. Please try again later."
      />
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Order Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/shop/dashboard/orders"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5 inline mr-1" />
            Back to Orders
          </Link>
          {order.payment_status && (
            <div className="text-green-600 flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-1" />
              Paid
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{order.id}
            </h1>
            <p className="text-gray-500 mt-1">
              Placed on {format(new Date(order.created_at), "MMMM d, yyyy")}
            </p>
          </div>
          <div>{getStatusBadge(order.order_status)}</div>
        </div>

        {/* Order Status Tracker */}
        <div className="mt-6 pt-6 border-t">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Order Status
          </h2>
          <OrderStatusTracker status={order.order_status} />
        </div>
      </div>

      {/* Order Items */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="py-4 flex items-center">
              <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                {item.product && item.product.primary_image ? (
                  <Image
                    src={item.product.primary_image.url}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="ml-4 flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  {item.product ? item.product.name : "Product"}
                </h3>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>

              <div className="text-right">
                <PriceDisplay
                  amount={item.product.price_data.amount * item.quantity}
                  sourceCurrency="USD"
                  className="font-medium"
                />
                {item.quantity > 1 && (
                  <p className="text-xs text-gray-500">
                    <PriceDisplay
                      amount={item.product.price_data.amount}
                      sourceCurrency="USD"
                    />{" "}
                    each
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Order Summary
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <PriceDisplay
              amount={order.total_amount - (order.shipping_fee || 0)}
              sourceCurrency="USD"
            />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Shipping</span>
            {order.shipping_fee > 0 ? (
              <PriceDisplay amount={order.shipping_fee} sourceCurrency={selectedCurrency} />
            ) : (
              <span className="text-green-600">Free</span>
            )}
          </div>

          <div className="flex justify-between text-base font-medium pt-2 border-t">
            <span className="text-gray-900">Total</span>
            <PriceDisplay amount={order.total_amount} sourceCurrency="USD" />
          </div>
        </div>
      </div>

      {/* Shipping Information */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Shipping Information
        </h2>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="whitespace-pre-line text-gray-700">
            {order.shipping_address}
          </p>
        </div>

        {/* Tracking Information - show only if shipped */}
        {order.tracking_number &&
          (order.order_status === "shipped" ||
            order.order_status === "delivered") && (
            <div className="mt-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-center">
                  <PackageCheck className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-blue-700 font-medium">
                    Tracking Number:
                  </span>
                  <span className="ml-2 text-blue-800">
                    {order.tracking_number}
                  </span>
                  <button
                    onClick={copyTrackingNumber}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                    aria-label="Copy tracking number"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 flex flex-wrap gap-4">
        <Link href="/shop/dashboard/orders">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>

        {/* Cancel Order - show only if pending */}
        {order.order_status === "pending" && (
          <CancelOrderButton orderId={order.id} />
        )}
      </div>
    </div>
  );
}
