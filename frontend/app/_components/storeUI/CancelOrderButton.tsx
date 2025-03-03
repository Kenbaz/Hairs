"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../UI/Button";
import { Loader2 } from "lucide-react";
import { orderService } from "@/src/libs/services/customerServices/orderService";
import { ConfirmModal } from "../UI/ConfirmModal";
import { showToast } from "../_providers/ToastProvider";

interface CancelOrderButtonProps {
  orderId: number;
}

export function CancelOrderButton({ orderId }: CancelOrderButtonProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: cancelOrder, isPending } = useMutation({
    mutationFn: () => orderService.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      showToast.success("Order cancelled successfully");
    },
    onError: (error) => {
      console.error("Failed to cancel order:", error);
      showToast.error("Failed to cancel order");
    },
  });

  return (
    <>
      <Button
        variant="outline"
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setShowConfirmModal(true)}
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Cancel Order
      </Button>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          cancelOrder();
          setShowConfirmModal(false);
        }}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel Order"
        variant="danger"
      />
    </>
  );
}
