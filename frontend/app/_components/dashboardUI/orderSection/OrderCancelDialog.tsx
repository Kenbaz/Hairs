"use client";

import { useState } from "react";
import { Button } from "../../UI/Button";
// import { Input } from "../../UI/Input";
import { Alert } from "../../UI/Alert";
import {AdminOrder} from "@/src/types";

interface CancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<AdminOrder>;
  isLoading: boolean;
}

export default function CancellationDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: CancellationDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (err) {
        setError("Failed to cancel order");
        console.error("Failed to cancel order:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex px-4 items-center justify-center bg-black bg-opacity-50 shadow-sm">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg text-gray-900 font-medium mb-4">Cancel Order</h2>

        {error && <Alert type="error" message={error} className="mb-4" />}

        <div className="flex justify-end space-x-2">
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={onClose} disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="bg-slate-700 hover:bg-slate-800"
            onClick={handleConfirm}
            isLoading={isLoading}>
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </div>
  );
}
