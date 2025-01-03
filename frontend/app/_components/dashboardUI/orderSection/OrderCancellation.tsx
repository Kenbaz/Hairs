"use client";

import { useState } from "react";
import { AdminOrder } from "@/src/types";
import { Button } from "../../UI/Button";
import { PriceDisplay } from "../../UI/PriceDisplay";
import CancellationDialog from "./OrderCancelDialog";

interface OrderCancellationProps {
  order: AdminOrder;
  onCancel: () => Promise<AdminOrder>;
  onUpdateRefund: (status: AdminOrder["refund_status"]) => Promise<AdminOrder>;
  isLoading: boolean;
}

export default function OrderCancellation({
  order,
  onCancel,
  onUpdateRefund,
  isLoading,
}: OrderCancellationProps) {
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);

  const getRefundStatusBadge = (status: AdminOrder["refund_status"]) => {
    const styles = {
      none: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };

    return styles[status] || styles.none;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          Order Cancellation
        </h2>
      </div>

      <div className="p-4">
        {order.order_status === "cancelled" ? (
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Cancelled At
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(order.cancelled_at!).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Refund Status
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getRefundStatusBadge(
                    order.refund_status
                  )}`}
                >
                  {order.refund_status.charAt(0).toUpperCase() +
                    order.refund_status.slice(1)}
                </span>
                {order.refund_amount && (
                  <span className="text-sm text-gray-500">
                    (
                    <PriceDisplay
                      amount={order.refund_amount}
                      sourceCurrency="USD"
                    />
                    )
                  </span>
                )}
              </div>
            </div>

            {order.refund_status !== "completed" &&
              order.refund_status !== "failed" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onUpdateRefund("completed")}
                    isLoading={isLoading}
                  >
                    Mark Refund Complete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onUpdateRefund("failed")}
                    isLoading={isLoading}
                  >
                    Mark Refund Failed
                  </Button>
                </div>
              )}
          </div>
        ) : (
          <div>
            {["pending", "processing"].includes(order.order_status) ? (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Cancel this order if the customer requests cancellation or if
                  the order cannot be fulfilled.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowCancellationDialog(true)}
                  disabled={isLoading}
                >
                  Cancel Order
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                This order cannot be cancelled as it has already been{" "}
                {order.order_status}.
              </p>
            )}
          </div>
        )}
      </div>

      <CancellationDialog
        isOpen={showCancellationDialog}
        onClose={() => setShowCancellationDialog(false)}
        onConfirm={onCancel}
        isLoading={isLoading}
      />
    </div>
  );
}
