"use client";

import { useQuery } from "@tanstack/react-query";
import { adminPaymentService } from "@/src/libs/services/adminServices/adminPaymentService";
import { Alert } from "@/app/_components/UI/Alert";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { PaymentStatusBadge } from "./PaymentList";

interface PaymentDetailsProps {
  paymentId: number;
}

export function PaymentDetails({ paymentId }: PaymentDetailsProps) {
  const {
    data: payment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: () => adminPaymentService.getPaymentDetails(paymentId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !payment) {
    return <Alert type="error" message="Failed to load payment details" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Payment Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
        <dl className="grid grid-cols-1 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Reference</dt>
            <dd className="mt-1 text-sm text-gray-900">{payment.reference}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Provider Reference
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {payment.provider_reference || "N/A"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Amount</dt>
            <dd className="mt-1 text-sm text-gray-900">
              ${payment.amount.toFixed(2)} {payment.payment_currency}
              {payment.payment_currency !== payment.base_currency && (
                <span className="text-gray-500 ml-2">
                  (${payment.original_amount.toFixed(2)} {payment.base_currency}
                  )
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1">
              <PaymentStatusBadge status={payment.status} />
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Payment Method
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {payment.payment_method}
            </dd>
          </div>
        </dl>
      </div>

      {/* Customer & Order Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          Customer & Order Information
        </h2>
        <dl className="grid grid-cols-1 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {payment.customer_name}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Customer Email
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {payment.customer_email}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Order ID</dt>
            <dd className="mt-1 text-sm text-gray-900">#{payment.order_id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created At</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {format(new Date(payment.created_at), "PPp")}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Paid At</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {payment.paid_at
                ? format(new Date(payment.paid_at), "PPp")
                : "N/A"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Additional Information */}
      {payment.error_message && (
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Error Information</h2>
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">{payment.error_message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
