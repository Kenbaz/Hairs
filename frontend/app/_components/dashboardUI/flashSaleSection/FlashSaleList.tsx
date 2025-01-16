'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminFlashSaleService } from "@/src/libs/services/adminServices/adminFlashService";
import { ConfirmModal } from "@/app/_components/UI/ConfirmModal";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import {
  Clock,
  TagsIcon,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  BarChart2,
} from "lucide-react";
import { FlashSale } from "@/src/types";
import Link from "next/link";
import { Button } from "@/app/_components/UI/Button";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const getStatusColor = (status: FlashSale["status"]) => {
  const colors = {
    scheduled: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    ended: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const getProgressPercentage = (flashSale: FlashSale) => {
  const now = new Date();
  const start = parseISO(flashSale.start_time);
  const end = parseISO(flashSale.end_time);

  if (isBefore(now, start)) return 0;
  if (isAfter(now, end)) return 100;

  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.round((elapsed / total) * 100);
};

const SortButton = ({
  field,
  currentSort,
  onSort,
}: {
  field: string;
  currentSort: { field: string; direction: "asc" | "desc" };
  onSort: (field: string) => void;
}) => {
  const isActive = currentSort.field === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-gray-900"
    >
      <span>{field.charAt(0).toUpperCase() + field.slice(1)}</span>
      <div className="flex flex-col">
        <ChevronUp
          className={`h-3 w-3 ${
            isActive && currentSort.direction === "asc"
              ? "text-blue-600"
              : "text-gray-400"
          }`}
        />
        <ChevronDown
          className={`h-3 w-3 ${
            isActive && currentSort.direction === "desc"
              ? "text-blue-600"
              : "text-gray-400"
          }`}
        />
      </div>
    </button>
  );
};

export default function FlashSalesList() {
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });

  const [sort, setSort] = useState({
    field: "start_time",
    direction: "desc" as "asc" | "desc",
  });

  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["flashSales", filters, sort],
    queryFn: async () => {
      const response = await adminFlashSaleService.getFlashSales({
        ...filters,
        page: 1,
        page_size: 10,
      });
      console.log('response', response.results);
      return response.results; // Access the results array from the response
    },
  });

  const handleSort = (field: string) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const handleSearch = (searchTerm: string) => {
    setFilters((prev) => ({ ...prev, search: searchTerm }));
  };

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await adminFlashSaleService.deleteFlashSale(deletingId);
      // Invalidate and refetch the flash sales query
      queryClient.invalidateQueries({ queryKey: ["flashSales"] });
    } catch (error) {
      console.error("Failed to delete flash sale:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Flash Sales</h1>
        <Button
          onClick={() => router.push("/admin/marketing/flash_sale/create")}
          className="flex items-center space-x-2"
        >
          <TagsIcon className="h-4 w-4" />
          <span>Create Flash Sale</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search flash sales..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            {["all", "scheduled", "active", "ended", "cancelled"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() =>
                    handleStatusFilter(status === "all" ? "" : status)
                  }
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filters.status === (status === "all" ? "" : status)
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Flash Sales List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <SortButton
                    field="name"
                    currentSort={sort}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-6 py-3 text-left">
                  <SortButton
                    field="start_time"
                    currentSort={sort}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-6 py-3 text-left">Duration</th>
                <th className="px-6 py-3 text-left">Discount</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Progress</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data &&
                data.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-gray-900">
                            {sale.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {sale.products.length} products
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {format(
                          parseISO(sale.start_time),
                          "MMM d, yyyy h:mm a"
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        to{" "}
                        {format(parseISO(sale.end_time), "MMM d, yyyy h:mm a")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {format(
                            parseISO(sale.end_time).getTime() -
                              parseISO(sale.start_time).getTime(),
                            "d 'days' H 'hours'"
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {sale.discount_type === "percentage"
                          ? `${sale.discount_value}% off`
                          : `$${sale.discount_value} off`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          sale.status
                        )}`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${getProgressPercentage(sale)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/admin/marketing/flash_sale/${sale.id}/stats`}
                          className="p-1 hover:bg-gray-100 rounded-full"
                          title="View Statistics"
                        >
                          <BarChart2 className="h-5 w-5 text-gray-600" />
                        </Link>
                        <Link
                          href={`/admin/marketing/flash_sale/${sale.id}/edit`}
                          className="p-1 hover:bg-gray-100 rounded-full"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5 text-gray-600" />
                        </Link>
                        <button
                          onClick={() => setDeletingId(sale.id)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {(!data || data.length === 0) && (
          <div className="text-center py-12">
            <TagsIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No flash sales
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new flash sale.
            </p>
            <div className="mt-6">
              <Button
                onClick={() =>
                  router.push("/admin/marketing/flash_sale/create")
                }
              >
                Create Flash Sale
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Flash Sale"
        message="Are you sure you want to delete this flash sale? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
