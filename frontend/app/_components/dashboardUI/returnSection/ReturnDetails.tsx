"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert } from "../../UI/Alert";
import { Breadcrumb } from "../../UI/Breadcrumb";
import { ReturnRequest } from "@/src/types";
import { adminReturnService } from "@/src/libs/services/adminServices/adminReturnServices";
import ReturnInformation from "./ReturnInfo";
import ReturnStatusUpdate from "./ReturnStatusUpdate";
import CustomerInfo from "../orderSection/CustomerInfo";


export default function ReturnDetails() {
  const params = useParams();
  const queryClient = useQueryClient();
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const returnId = Number(params.id);

    
  const {
    data: returnRequest,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["returns", returnId],
    queryFn: () => adminReturnService.getReturn(returnId),
  });

    
  const updateStatusMutation = useMutation({
    mutationFn: ({
      status,
      notes,
    }: {
      status: ReturnRequest["return_status"];
      notes?: string;
    }) => adminReturnService.updateStatus(returnId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["returns", returnId] });
      setAlert({
        type: "success",
        message: "Return status updated successfully",
      });
    },
    onError: () => {
      setAlert({ type: "error", message: "Failed to update return status" });
    },
  });

    
  const updateRefundMutation = useMutation({
    mutationFn: ({
      refund_status,
      refund_amount,
    }: {
      refund_status: ReturnRequest["refund_status"];
      refund_amount?: number;
    }) =>
      adminReturnService.updateRefund(returnId, refund_status, refund_amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["returns", returnId] });
      setAlert({
        type: "success",
        message: "Refund status updated successfully",
      });
    },
    onError: () => {
      setAlert({ type: "error", message: "Failed to update refund status" });
    },
  });

    
  const handleUpdateStatus = async (
    status: ReturnRequest["return_status"],
    notes?: string
  ) => {
    await updateStatusMutation.mutateAsync({ status, notes });
  };

    
  const handleUpdateRefund = async (
    refund_status: ReturnRequest["refund_status"],
    refund_amount?: number
  ) => {
    await updateRefundMutation.mutateAsync({ refund_status, refund_amount });
  };

    
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
      </div>
    );
  }

    
  if (error || !returnRequest) {
    return <Alert type="error" message="Failed to load return details" />;
  }

    
  return (
    <div className="space-y-6 min-h-screen px-2 md:px-0 md:mt-[2%] xl:-mt-[2%] xl:pt-1 2xl:pt-2">
      <Breadcrumb />

      {alert && <Alert type={alert.type} message={alert.message} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Return Request #{returnRequest.id}
          </h1>
          <p className="text-sm text-gray-500">
            For Order #{returnRequest.order_number}
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:h-screen md:grid-style4 gap-6 md:gap-4">
        {/* Main Content - 2 columns */}
        <div className="col-span-2 space-y-6">
          <ReturnInformation
            returnRequest={returnRequest}
            onUpdateRefund={handleUpdateRefund}
          />
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6 md:space-y-4 md:h-full col-span-2 md:col-span-1">
          <ReturnStatusUpdate
            currentStatus={returnRequest.return_status}
            onUpdateStatus={handleUpdateStatus}
            isLoading={updateStatusMutation.isPending}
          />
          <CustomerInfo
            customerName={returnRequest.customer_name}
            customerEmail={returnRequest.customer_name}
            shippingAddress={""}
          />
        </div>
      </div>
    </div>
  );
}
