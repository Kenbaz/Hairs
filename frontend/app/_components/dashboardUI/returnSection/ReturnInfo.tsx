'use client';

import { useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import { Package } from "lucide-react";
import { ReturnRequest } from "@/src/types";
import { Button } from "../../UI/Button";
import { Input } from "../../UI/Input";
import { PriceDisplay } from "../../UI/PriceDisplay";

interface ReturnInformationProps {
  returnRequest: ReturnRequest;
  onUpdateRefund: (
    status: ReturnRequest["refund_status"],
    amount?: number
  ) => void;
}

export default function ReturnInformation({
  returnRequest,
  onUpdateRefund,
}: ReturnInformationProps) {
  const [showRefundUpdate, setShowRefundUpdate] = useState(false);
  const [refundAmount, setRefundAmount] = useState(
    returnRequest.refund_amount || 0
  );

  const handleRefundUpdate = async (status: ReturnRequest["refund_status"]) => {
    await onUpdateRefund(status, refundAmount);
    setShowRefundUpdate(false);
  };

  const getImageUrl = (imageUrl: string | undefined | null): string | null => {
    if (!imageUrl) return null;

    // If URL contains cloudinary path multiple times, extract the last valid cloudinary URL
    if (imageUrl.includes("cloudinary.com")) {
      // Find the last occurrence of 'https://res.cloudinary.com'
      const cloudinaryStart = imageUrl.lastIndexOf(
        "https://res.cloudinary.com"
      );
      if (cloudinaryStart !== -1) {
        return imageUrl.slice(cloudinaryStart);
      }
    }

    // If it's a relative path, append base URL
    if (imageUrl.startsWith("/")) {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      return `${baseUrl}${imageUrl}`;
    }

    return null;
  };


  return (
    <div className="bg-white h-full rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          Return Information
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Return Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">
              Return Date
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {format(new Date(returnRequest.created_at), "PPP")}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Last Updated
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {format(new Date(returnRequest.updated_at), "PPP")}
            </p>
          </div>
        </div>

        {/* Return Reason */}
        <div>
          <label className="text-sm font-medium text-gray-600">
            Return Reason
          </label>
          <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
            {returnRequest.reason}
          </p>
        </div>

        {/* Return Items */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            Items Being Returned
          </h3>
          <div className="border shadow rounded-lg divide-y divide-gray-200">
            {returnRequest.items.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No return items found</p>
              </div>
            ) : (
              returnRequest.items.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Image handling */}
                    {item.images && item.images.length > 0 ? (
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                        <Image
                          src={getImageUrl(item.images?.[0]?.image) || ""}
                          alt={item.product_name}
                          fill
                          priority
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.product_name}
                        </h4>
                        <span className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-600">
                        Condition:{" "}
                        {item.condition.charAt(0).toUpperCase() +
                          item.condition.slice(1)}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Reason: {item.reason}
                      </p>

                      {/* Item Images Gallery */}
                      {item.images && item.images.length > 0 && (
                        <div className="mt-2 flex -space-x-2 overflow-hidden">
                          {item.images.map((image) => {
                            const imageUrl = getImageUrl(image.image);
                            if (!imageUrl) return null;

                            return (
                              <div
                                key={image.id}
                                className="relative h-8 w-8 rounded-full border-2 border-white"
                              >
                                <Image
                                  src={imageUrl}
                                  alt={`${item.product_name} image ${image.id}`}
                                  fill
                                  priority
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  style={{ objectFit: "cover" }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">
              Refund Information
            </h3>
            {!showRefundUpdate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRefundUpdate(true)}
              >
                Update Refund
              </Button>
            )}
          </div>

          {showRefundUpdate ? (
            <div className="border rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Refund Amount
                </label>
                <div className="mt-1">
                  <Input
                    type="number"
                    className="rounded-lg text-gray-900 border"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Update Status
                </label>
                <div className="mt-2 space-y-2">
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => handleRefundUpdate("processing")}
                  >
                    Start Processing
                  </Button>
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => handleRefundUpdate("completed")}
                  >
                    Mark Completed
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleRefundUpdate("failed")}
                  >
                    Mark Failed
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowRefundUpdate(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Refund Status
                  </label>
                  <span
                    className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      returnRequest.refund_status === "completed"
                        ? "bg-green-100 text-green-800"
                        : returnRequest.refund_status === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {returnRequest.refund_status.charAt(0).toUpperCase() +
                      returnRequest.refund_status.slice(1)}
                  </span>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Refund Amount
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    <PriceDisplay
                      amount={returnRequest.refund_amount || 0}
                      sourceCurrency="USD"
                    />
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Return History */}
        <div className="hidden md:grid ">
          <h3 className="text-base font-medium text-gray-600 mb-3">History</h3>
          <div className="border rounded-lg divide-y divide-gray-200 max-h-[60vh] overflow-y-auto">
            {returnRequest.history.map((entry) => (
              <div key={entry.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-gray-900">
                    {entry.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(entry.created_at), "PPp")}
                  </span>
                </div>
                {entry.notes && (
                  <p className="mt-1 text-sm text-gray-500">{entry.notes}</p>
                )}
                <p className="mt-1 text-[0.8rem] text-gray-400">
                  by {entry.created_by_name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
