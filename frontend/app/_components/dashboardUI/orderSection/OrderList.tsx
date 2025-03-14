'use client';

import { useState } from "react";
import { MoreVertical, TrendingUp, Download, Eye } from "lucide-react";
import { Button } from "../../UI/Button";
import Link from "next/link";
import { AdminOrder } from "@/src/types";
import { PriceDisplay } from "../../UI/PriceDisplay";
// import { useRouter } from "next/navigation";
import { format } from "date-fns";


interface OrderListProps {
    orders: AdminOrder[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}


export default function OrderList({
    orders,
    totalCount,
    currentPage,
    pageSize,
    onPageChange,
}: OrderListProps) {
    const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
    // const router = useRouter();


    const getStatusStyle = (status: string) => {
        const styles = {
            pending: "bg-yellow-100 text-yellow-800",
            processing: "bg-blue-100 text-blue-800",
            shipped: "bg-purple-100 text-purple-800",
            delivered: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800",
        };

        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
    };

    const totalPages = Math.ceil(totalCount / pageSize);
    const endItem = Math.min(currentPage * pageSize, totalCount);


    return (
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 md:text-base xl:text-[0.8rem] uppercase"
                >
                  Order ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 md:text-base xl:text-[0.8rem] uppercase"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 md:text-base xl:text-[0.8rem] uppercase"
                >
                  Customer
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 md:text-base xl:text-[0.8rem] uppercase"
                >
                  Total
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 md:text-base xl:text-[0.8rem] uppercase"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 md:text-base xl:text-[0.8rem] uppercase"
                >
                  Payment
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-blue-600 text-base xl:text-sm hover:text-blue-900"
                    >
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[0.9rem] text-gray-600 md:text-base xl:text-sm">
                    {format(new Date(order.created_at), "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-base xl:text-sm font-medium text-gray-900">
                      {order.customer_name}
                    </div>
                    <div className="text-base xl:text-sm text-gray-500">
                      {order.customer_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    <PriceDisplay
                      amount={order.total_amount}
                      className="text-base xl:text-sm"
                      sourceCurrency="USD"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-[0.9rem] md:text-base xl:text-sm leading-5 font-semibold rounded-full ${getStatusStyle(
                        order.order_status
                      )}`}
                    >
                      {order.order_status.charAt(0).toUpperCase() +
                        order.order_status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-[0.9rem] md:text-base xl:text-sm leading-5 font-semibold rounded-full ${
                        order.payment_status
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.payment_status ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setSelectedOrder(
                            selectedOrder === order.id ? null : order.id
                          )
                        }
                        className="text-gray-500 hover:text-gray-600"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {selectedOrder === order.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1" role="menu">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="flex items-center px-4 py-2 text-base xl:text-sm text-gray-900 hover:bg-gray-200"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                            <button
                              className="w-full flex items-center px-4 py-2 text-base xl:text-sm text-gray-900 hover:bg-gray-200"
                              onClick={() => {
                                // Handle order tracking
                                setSelectedOrder(null);
                              }}
                            >
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Track Order
                            </button>
                            <button
                              className="w-full flex items-center px-4 py-2 text-base xl:text-sm text-gray-900 hover:bg-gray-200"
                              onClick={() => {
                                // Handle invoice download
                                setSelectedOrder(null);
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Invoice
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 -ml-[2%] md:pl-4">
              Showing <span className="font-medium">{endItem}</span> of{" "}
              <span className="font-medium">{totalCount}</span> orders
            </div>
            <div className="flex space-x-2">
              <Button
                className="rounded-lg bg-slate-700 border border-slate-700 hover:bg-slate-800 text-sm py-2 px-1 md:text-base xl:text-sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        page === currentPage
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <Button
                className="rounded-lg bg-slate-700 border border-slate-700 hover:bg-slate-800 text-sm py-2 px-1 md:text-base xl:text-sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
}