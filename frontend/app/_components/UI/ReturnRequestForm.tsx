'use client';

import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert } from "../UI/Alert";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { ImageUpload } from "../UI/ImageUpload";
import { returnService } from "@/src/libs/services/customerServices/returnService";
import { ReturnRequestForm as ReturnFormData, } from "@/src/types";

interface ReturnRequestFormProps {
    orderId: number;
    onSuccess: () => void;
}


export function ReturnRequestForm({ orderId, onSuccess }: ReturnRequestFormProps) { 
    const [selectedItems, setSelectedItems] = useState<{
        [key: number]: {
            quantity: number;
            reason: string;
            condition: "unopened" | "opened" | "damaged";
        };
    }>({});
    const [images, setImages] = useState<File[]>([]);
    const [generalReason, setGeneralReason] = useState("");
    const [error, setError] = useState<string | null>(null);


    // Fetch order details
    const { data: eligibleOrders, isLoading } = useQuery({
        queryKey: ['eligible-orders'],
        queryFn: () => returnService.getEligibleOrders(),
    });

    const order = eligibleOrders?.find((order) => order.id === orderId);

    // Submit return request
    const submitMutation = useMutation({
        mutationFn: (data: ReturnFormData) => returnService.submitReturnRequest(data),
        onSuccess: () => {
            onSuccess();
        },
        onError: (error) => {
            setError("Failed to submit return request. Please try again.");
            console.error("Return submission error:", error);
        },
    });


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!generalReason.trim()) {
            setError("Please provide a reason for the return request");
            return;
        }

        if (Object.keys(selectedItems).length === 0) {
            setError("Please select at least one item to return");
            return;
        }

        // Create return request data
        const returnData: ReturnFormData = {
            order_id: orderId,
            reason: generalReason,
            items: Object.entries(selectedItems).map(([productId, data]) => ({
                product_id: Number(productId),
                ...data,
            })),
            images: images,
        };

        submitMutation.mutate(returnData);
    };


    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!order) {
      return (
        <Alert
          type="error"
          message="Order not found or not eligible for return"
        />
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert type="error" message={error} />}

        {/* General Return Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Why are you returning these items?
          </label>
          <textarea
            value={generalReason}
            onChange={(e) => setGeneralReason(e.target.value)}
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm"
            rows={3}
            required
          />
        </div>

        {/* Items Selection */}
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Select Items to Return
          </h3>
          <div className="mt-4 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{item.product_name}</h4>
                    <p className="text-sm text-gray-500">
                      Original Quantity: {item.quantity}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!selectedItems[item.id]}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems((prev) => ({
                          ...prev,
                          [item.id]: {
                            quantity: 1,
                            reason: "",
                            condition: "unopened",
                          },
                        }));
                      } else {
                        const newItems = { ...selectedItems };
                        delete newItems[item.id];
                        setSelectedItems(newItems);
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>

                {selectedItems[item.id] && (
                  <div className="mt-4 space-y-4">
                    <Input
                      type="number"
                      label="Return Quantity"
                      min={1}
                      max={item.quantity}
                      value={selectedItems[item.id].quantity}
                      onChange={(e) => {
                        setSelectedItems((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            quantity: Number(e.target.value),
                          },
                        }));
                      }}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Condition
                      </label>
                      <select
                        value={selectedItems[item.id].condition}
                        onChange={(e) => {
                          setSelectedItems((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              condition: e.target.value as
                                | "unopened"
                                | "opened"
                                | "damaged",
                            },
                          }));
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      >
                        <option value="unopened">Unopened</option>
                        <option value="opened">Opened</option>
                        <option value="damaged">Damaged</option>
                      </select>
                    </div>

                    <textarea
                      placeholder="Specific reason for returning this item"
                      value={selectedItems[item.id].reason}
                      onChange={(e) => {
                        setSelectedItems((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            reason: e.target.value,
                          },
                        }));
                      }}
                      className="mt-1 w-full rounded-md border-gray-300 shadow-sm"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload Images
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Please upload photos showing the condition of the items you&apos;re
            returning
          </p>
          <ImageUpload
            value={images}
            onChange={setImages}
            onRemove={(index) => {
              const newImages = [...images];
              newImages.splice(index, 1);
              setImages(newImages);
            }}
            maxFiles={5}
            maxSize={5 * 1024 * 1024} // 5MB
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            isLoading={submitMutation.isPending}
            disabled={submitMutation.isPending}
          >
            Submit Return Request
          </Button>
        </div>
      </form>
    );
}