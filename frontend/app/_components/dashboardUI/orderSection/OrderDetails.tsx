"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ClipboardCheck, Download } from "lucide-react";
import { Button } from "../../UI/Button";
import { Alert } from "../../UI/Alert";
import { Breadcrumb } from "../../UI/Breadcrumb";
import { adminOrderService } from "@/src/libs/services/adminServices/adminOrderService";
import OrderStatusUpdate from "./OrderStatusUpdate";
import OrderInformation from "./OrderInformation";
import CustomerInfo from "./CustomerInfo";
import { AdminOrder } from "@/src/types";
import OrderCancellation from "./OrderCancellation";


export default function OrderDetails() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const orderId = Number(params.id);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => adminOrderService.getOrder(orderId),
  });


  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      adminOrderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
      setAlert({
        type: "success",
        message: "Order status updated successfully",
      });
    },
    onError: () => {
      setAlert({ type: "error", message: "Failed to update order status" });
    },
  });


  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) => adminOrderService.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
      setAlert({ type: "success", message: "Order cancelled successfully" });
    },
    onError: () => {
      setAlert({ type: "error", message: "Failed to cancel order" });
    },
  });


  const updateRefundStatusMutation = useMutation({
    mutationFn: (refundStatus: AdminOrder["refund_status"]) =>
      adminOrderService.updateRefundStatus(orderId, refundStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
      setAlert({
        type: "success",
        message: "Refund status updated successfully",
      });
    },
    onError: () => {
      setAlert({ type: "error", message: "Failed to update refund status" });
    },
  });


  const handleUpdateStatus = async (status: string) => {
    await updateStatusMutation.mutateAsync({ status });
  };


  const handleInvoiceDownload = async () => {
    try {
      const blob = await adminOrderService.downloadInvoice(orderId);

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a tempoary link and trigger the download
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setAlert({ type: "success", message: "Invoice downloaded successfully" });
    } catch (error) {
      console.error("Failed to download invoice:", error);
      setAlert({ type: "error", message: "Failed to download invoice" });
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !order) {
    return <Alert type="error" message="Failed to load order details" />;
  }


  return (
    <div className="space-y-6">
      <Breadcrumb />

      {alert && <Alert type={alert.type} message={alert.message} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Order #{order.id}
            </h1>
            <p className="text-sm text-gray-500">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              // Copy order details to clipboard
              navigator.clipboard.writeText(`Order #${order.id}`);
              setAlert({
                type: "success",
                message: "Order ID copied to clipboard",
              });
            }}
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" onClick={handleInvoiceDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="col-span-2 space-y-6">
          <OrderInformation order={order} />
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          <OrderStatusUpdate
            currentStatus={order.order_status}
            onUpdateStatus={handleUpdateStatus}
            isLoading={updateStatusMutation.isPending}
          />
          <OrderCancellation
            order={order}
            onCancel={() => cancelOrderMutation.mutateAsync(orderId)}
            onUpdateRefund={(status) =>
              updateRefundStatusMutation.mutateAsync(status)
            }
            isLoading={
              cancelOrderMutation.isPending ||
              updateRefundStatusMutation.isPending
            }
          />
          <CustomerInfo
            customerName={order.customer_name}
            customerEmail={order.customer_email}
            shippingAddress={order.shipping_address}
          />
        </div>
      </div>
    </div>
  );
}
