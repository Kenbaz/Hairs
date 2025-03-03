"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/src/libs/services/customerServices/orderService";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ChevronRight, Loader2, PackageX } from "lucide-react";
import { PriceDisplay } from "../UI/PriceDisplay";
import { CustomerOrder, CustomerOrderResponse } from "@/src/types";
import { Pagination } from "../UI/Pagination";

export function OrderHistory() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5); // Number of orders per page

  const { data, isLoading, error } = useQuery<CustomerOrderResponse>({
    queryKey: ["user-orders", page, pageSize],
    queryFn: () =>
      orderService.getOrders({ page, page_size: pageSize }),
  });

  const getStatusBadge = (status: string) => {
    const statusInfo: Record<string, { color: string; message: string }> = {
      pending: {
        color: "text-yellow-800",
        message: "Your order has been received and is awaiting processing",
      },
      processing: {
        color: "text-blue-800",
        message: "We're preparing your items for shipment",
      },
      shipped: {
        color: "text-purple-800",
        message: "Your order is on its way to you",
      },
      delivered: {
        color: "text-green-800",
        message: "Your order has been delivered",
      },
      cancelled: {
        color: "text-red-800",
        message: "This order has been cancelled",
      },
    };

    const { color, message } = statusInfo[status] || {
      color: "bg-gray-100 text-gray-800",
      message: "Status unknown",
    };

    return (
      <div className="flex flex-col items-start">
        <span className={` py-1 rounded-full text-xs font-medium ${color}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <span className="text-xs text-gray-500 mt-1">{message}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        There was an error loading your orders. Please try again later.
      </div>
    );
  }

  if (!data || !data.results || data.results.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <PackageX className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
        <p className="mt-2 text-sm text-gray-500">
          You haven&apos;t placed any orders yet.
        </p>
        <div className="mt-6">
          <Link
            href="/shop/products"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-medium text-gray-900">Order History</h2>
      </div>
      <div className="divide-y">
        {data.results.map((order: CustomerOrder) => (
          <Link
            key={order.id}
            href={`/shop/dashboard/orders/${order.id}`}
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="font-medium text-gray-900">
                  Order #{order.id}
                </span>
                {getStatusBadge(order.order_status)}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                Placed{" "}
                {formatDistanceToNow(new Date(order.created_at), {
                  addSuffix: true,
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <PriceDisplay
                  amount={order.total_amount}
                  sourceCurrency="USD"
                  className="font-medium"
                />
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {data && data.count > pageSize && (
        <div className="px-6 py-4 border-t flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(data.count / pageSize)}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
