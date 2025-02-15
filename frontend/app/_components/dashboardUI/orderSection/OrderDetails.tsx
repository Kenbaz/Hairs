"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Loader2, Download } from "lucide-react";
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


  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };


  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      adminOrderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
      showAlert("success", "Order status updated successfully");
    },
    onError: () => {
      showAlert("error", "Failed to update order status");
    },
  });


  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) => adminOrderService.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
      showAlert("success", "Order cancelled successfully");
    },
    onError: () => {
      showAlert("error", "Failed to cancel order");
    },
  });


  const updateRefundStatusMutation = useMutation({
    mutationFn: (refundStatus: AdminOrder["refund_status"]) =>
      adminOrderService.updateRefundStatus(orderId, refundStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
      showAlert("success", "Refund status updated successfully");
    },
    onError: () => {
      showAlert("error", "Failed to update refund status");
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

      showAlert("success", "Invoice downloaded successfully");
    } catch (error) {
      console.error("Failed to download invoice:", error);
      showAlert("error", "Failed to download invoice");
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
      </div>
    );
  }

  if (error || !order) {
    return <Alert type="error" message="Failed to load order details" />;
  }


  return (
    <div className="space-y-6 px-2 md:mt-[2%] md:pt-[1%] xl:-mt-[2%]">
      <Breadcrumb />

      {alert && <Alert type={alert.type} message={alert.message} />}

      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between space-x-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Order #{order.id}
            </h1>
            <p className="text-sm text-gray-500">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <Button
            className="border border-slate-700 bg-slate-700 hover:bg-slate-800"
            onClick={handleInvoiceDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:h-screen md:grid-style4 gap-6 md:gap-4">
        {/* Main Content - 2 columns */}
        <div className="col-span-2 space-y-6">
          <OrderInformation order={order} />
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6 md:space-y-4 md:h-full col-span-2 md:col-span-1">
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
