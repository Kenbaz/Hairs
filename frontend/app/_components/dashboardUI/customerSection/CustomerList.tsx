'use client';

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Mail, Eye, Loader2, ChevronDown } from "lucide-react";
import { Input } from "../../UI/Input";
import { Button } from "../../UI/Button";
import { Alert } from "../../UI/Alert";
import { adminUserService } from "@/src/libs/services/adminServices/adminUserService";
import { UserFilters, SelectedCustomers } from "@/src/types";
import { PriceDisplay } from "../../UI/PriceDisplay";
import Link from "next/link";
import CustomerFilters from "./CustomerFilters";
import { BulkEmail } from "../supportSection/BulkEmail";
import { ModalForComponents } from "../../UI/ModalForComponents";


export default function CustomerListPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<SelectedCustomers>(
    {}
  );
  const [filters, setFilters] = useState<
    UserFilters & { page: number; page_size: number }
  >({
    page: 1,
    page_size: 10,
    search: "",
    is_active: undefined,
    verified_email: undefined,
    joined_after: undefined,
  });

  const queryClient = useQueryClient();

  // Fetch customers
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers", filters],
    queryFn: () => adminUserService.getUsers(filters),
  });


  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (userId: number) => adminUserService.toggleUserStatus(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });


  const handleSelectCustomer = (customerId: number) => {
    setSelectedCustomers((prev) => ({
      ...prev,
      [customerId]: !prev[customerId],
    }));
  };


  const handleSelectAllCustomers = (checked: boolean) => {
    if (data) {
      const newSelected = { ...selectedCustomers };
      data.results.forEach((customer) => {
        newSelected[customer.id] = checked;
      });
      setSelectedCustomers(newSelected);
    }
  };


  const selectedCustomerIds = Object.entries(selectedCustomers)
    .filter(([, isSelected]) => isSelected)
    .map(([id]) => parseInt(id));
  

  // Handle search with debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSearch = (value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: value,
        page: 1, // Reset to first page on new search
      }));
    }, 300); // 300ms delay
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page on filter change
    }));
  };

  // const totalPages = Math.ceil(data.count / filters.page_size);

  if (error) {
    return <Alert type="error" message="Failed to load customers" />;
  }

  return (
    <div className="space-y-6 px-2 md:px-0 h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        {selectedCustomerIds.length > 0 && (
          <Button
            className="bg-slate-700 hover:bg-slate-800 rounded-lg border border-slate-700 text-xm md:text-base"
            onClick={() => setShowBulkEmail(true)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Bulk Email
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl md:rounded-lg h-full">
        {/* Search and Filter Bar */}
        <div className="flex items-center gap-3 py-2 mb-3 px-2 md:gap-4 md:px-4">
          <div className="relative flex-1 md:flex md:h-[2.7rem] xl:h-[3rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-500" />
            <Input
              placeholder="Search Orders..."
              className="pl-10 w-full md:w-[70%] xl:w-[50%] md:h-full rounded-full text-gray-600 text-base"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center min-w-[100px]">
            <Button
              className="bg-gray-50 hover:bg-gray-100 w-full rounded-lg border"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <span className="text-gray-800 md:text-base">Filters</span>
              <ChevronDown
                className={`h-4 w-4 ml-2 text-gray-800 transition-transform duration-200 ${
                  filterOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {filterOpen && (
          <CustomerFilters filters={filters} onChange={handleFilterChange} />
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
          </div>
        )}

        {/* Customer List Table */}
        {!isLoading && data && (
          <div className="bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={
                          data.results.length > 0 &&
                          data.results.every(
                            (customer) => selectedCustomers[customer.id]
                          )
                        }
                        onChange={(e) =>
                          handleSelectAllCustomers(e.target.checked)
                        }
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 md:text-base lg:landscape:text-[0.9rem] uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 md:text-base lg:landscape:text-[0.9rem] uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 md:text-base lg:landscape:text-[0.9rem] uppercase">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 md:text-base lg:landscape:text-[0.9rem] uppercase">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 md:text-base lg:landscape:text-[0.9rem] uppercase">
                      Joined
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.results.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedCustomers[customer.id] || false}
                          onChange={() => handleSelectCustomer(customer.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xl lg:landscape:text-lg xl:overide4 font-medium text-gray-500">
                                {customer.first_name?.[0]?.toUpperCase()}
                                {customer.last_name?.[0]?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-base md:text-base lg:landscape:text-[0.85rem] xl:overide3 font-medium text-gray-900">
                              {customer.first_name} {customer.last_name}
                            </div>
                            <div className="text-base lg:landscape:text-[0.9rem] text-gray-500">
                              {customer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            toggleActiveMutation.mutate(customer.id)
                          }
                          disabled={toggleActiveMutation.isPending}
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            customer.is_active
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {customer.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base lg:landscape:text-[0.85rem] xl:overide3 font-medium text-gray-900">
                        {customer.total_orders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base lg:landscape:text-[0.85rem] xl:overide3 font-medium text-gray-900">
                        <PriceDisplay
                          amount={customer.total_spent}
                          sourceCurrency="USD"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base lg:landscape:text-[0.85rem] xl:overide3 font-medium text-gray-500">
                        {new Date(customer.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right lg:landscape:text-[0.9rem] xl:overide3 font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`mailto:${customer.email}`}
                            className="text-gray-500 hover:text-gray-600"
                          >
                            <Mail className="h-5 w-5" />
                          </Link>
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="text-gray-500 hover:text-gray-600"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
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
                <div className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {Math.min(filters.page * filters.page_size, data.count)}
                  </span>{" "}
                  of <span className="font-medium">{data.count}</span> customers
                </div>
                <div className="flex space-x-2">
                  <Button
                    className="rounded-lg bg-slate-700 border border-slate-700 hover:bg-slate-800 text-sm py-2 px-1 md:text-base lg:landscape:text-[0.8rem]"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={filters.page === 1}
                  >
                    Previous
                  </Button>
                  {/* Page Numbers */}
                  <div className="hidden md:flex items-center gap-1">
                    {Array.from(
                      { length: Math.ceil(data.count / filters.page_size) },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, page: page }))
                        }
                        className={`px-3 py-1 text-sm rounded-md ${
                          page === filters.page
                            ? "bg-slate-100 text-slate-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button
                    className="rounded-lg bg-slate-700 border border-slate-700 hover:bg-slate-800 text-sm py-2 px-1 md:text-base lg:landscape:text-[0.8rem]"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={
                      filters.page === Math.ceil(data.count / filters.page_size)
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Email Modal */}
        {showBulkEmail && (
          <ModalForComponents isOpen onClose={() => setShowBulkEmail(false)}>
            <BulkEmail
              onClose={() => {
                setShowBulkEmail(false);
                setSelectedCustomers({});
              }}
              selectedCustomerIds={selectedCustomerIds}
            />
          </ModalForComponents>
        )}
      </div>
    </div>
  );
}
