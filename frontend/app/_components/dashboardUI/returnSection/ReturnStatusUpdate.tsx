'use client';

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "../../UI/Button";
// import { Input } from "../../UI/Input";
import { ReturnRequest } from "@/src/types";


interface ReturnStatusUpdateProps {
  currentStatus: ReturnRequest["return_status"];
  onUpdateStatus: (status: ReturnRequest["return_status"], notes?: string) => void;
  isLoading: boolean;
}

export default function ReturnStatusUpdate({
  currentStatus,
  onUpdateStatus,
  isLoading,
}: ReturnStatusUpdateProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    ReturnRequest["return_status"] | null
  >(null);
  const [notes, setNotes] = useState("");

  const RETURN_STATUSES = [
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
      description: "Return request is awaiting review",
    },
    {
      value: "approved",
      label: "Approved",
      color: "bg-green-100 text-green-800",
      description: "Return request has been approved",
    },
    {
      value: "rejected",
      label: "Rejected",
      color: "bg-red-100 text-red-800",
      description: "Return request has been rejected",
    },
    {
      value: "completed",
      label: "Completed",
      color: "bg-blue-100 text-blue-800",
      description: "Return has been processed and completed",
    },
  ] as const;

  const handleStatusClick = (status: ReturnRequest["return_status"]) => {
    if (status === currentStatus) return;
    setSelectedStatus(status);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (selectedStatus) {
      try {
        await onUpdateStatus(selectedStatus, notes);
        setShowConfirm(false);
        setSelectedStatus(null);
        setNotes("");
      } catch (error) { 
        console.error("Failed to update return status:", error);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Return Status</h2>
      </div>

      <div className="p-4">
        {showConfirm ? (
          <div className="space-y-4">
            <div>
              <p className="text-base text-gray-900">
                Are you sure you want to change the return status to{" "}
                <span className="font-medium">
                  {
                    RETURN_STATUSES.find((s) => s.value === selectedStatus)
                      ?.label
                  }
                </span>
                ?
              </p>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any notes about this status change..."
                  className="w-full border p-2 rounded-lg"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleConfirm}
                isLoading={isLoading}
                className="w-full bg-blue-700 hover:bg-blue-800"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm
              </Button>
              <Button
                onClick={() => {
                  setShowConfirm(false);
                  setSelectedStatus(null);
                  setNotes("");
                }}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-gray-900">
            {RETURN_STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => handleStatusClick(status.value)}
                className={`w-full p-4 rounded-lg text-left transition-colors ${
                  status.value === currentStatus
                    ? status.color
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{status.label}</span>
                  <span className="text-[0.8rem] text-gray-500 mt-1">
                    {status.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current Status */}
      <div className="px-4 py-3 rounded-b-lg bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Current Status</span>
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              RETURN_STATUSES.find((s) => s.value === currentStatus)?.color
            }`}
          >
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
