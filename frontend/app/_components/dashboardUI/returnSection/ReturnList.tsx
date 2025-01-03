'use client';

import { format } from "date-fns";
import Link from "next/link";
import { MoreVertical, Eye } from "lucide-react";
import { ReturnRequest } from "@/src/types";
import { PriceDisplay } from "../../UI/PriceDisplay";
import { Button } from "../../UI/Button";
import { useState } from "react";

interface ReturnsListProps {
    returns: ReturnRequest[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export default function ReturnsList({
    returns,
    totalCount,
    currentPage,
    pageSize,
    onPageChange,
}: ReturnsListProps) {
  const [selectedReturn, setSelectedReturn] = useState<number | null>(null);

  const getStatusStyle = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };

    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getRefundStatusStyle = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };

    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Return ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Order
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Customer
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Refund
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {returns.map((returnRequest) => (
              <tr key={returnRequest.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/admin/orders/returns/${returnRequest.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    #{returnRequest.id}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/admin/orders/${returnRequest.order_number}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Order #{returnRequest.order_number}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {returnRequest.customer_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(
                      returnRequest.return_status
                    )}`}
                  >
                    {returnRequest.return_status.charAt(0).toUpperCase() +
                      returnRequest.return_status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRefundStatusStyle(
                        returnRequest.refund_status
                      )}`}
                    >
                      {returnRequest.refund_status.charAt(0).toUpperCase() +
                        returnRequest.refund_status.slice(1)}
                    </span>
                    {returnRequest.refund_amount || 0 > 0 && (
                      <span className="text-sm text-gray-500">
                        <PriceDisplay
                          amount={returnRequest.refund_amount || 0}
                          sourceCurrency="USD"
                        />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(returnRequest.created_at), "MMM d, yyyy")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setSelectedReturn(
                          selectedReturn === returnRequest.id
                            ? null
                            : returnRequest.id
                        )
                      }
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {selectedReturn === returnRequest.id && (
                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1" role="menu">
                          <Link
                            href={`/admin/orders/returns/${returnRequest.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setSelectedReturn(null)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
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
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{totalCount}</span> returns
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
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
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* No Returns Message */}
      {returns.length === 0 && (
        <div className="px-6 py-8 text-center">
          <div className="text-sm text-gray-500">No return requests found</div>
        </div>
      )}
    </div>
  );
}