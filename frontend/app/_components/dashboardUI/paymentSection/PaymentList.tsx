"use client";

import { useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminPaymentService } from "@/src/libs/services/adminServices/adminPaymentService";
import { PaymentFilters } from "@/src/types";
import { format } from "date-fns";
import { EyeIcon, Search } from "lucide-react";
import { Input } from "@/app/_components/UI/Input";
import Link from "next/link";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { ChevronDown, Check } from "lucide-react";


interface PaymentStatusBadgeProps {
  status: string;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles()}`}
    >
      {status}
    </span>
  );
};


const STATUS_OPTIONS = [
  { id: "", name: "All Status" },
  { id: "pending", name: "Pending" },
  { id: "success", name: "Success" },
  { id: "failed", name: "Failed" },
] as const;

// type PaymentStatus = (typeof STATUS_OPTIONS)[number]["id"];


export function PaymentList() {
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    page_size: 10,
  });

  const { data } = useQuery({
    queryKey: ["payments", filters],
    queryFn: () => adminPaymentService.getAllTransactions(filters),
  });


  const StatusFilter = () => {
    const selectedStatus =
      STATUS_OPTIONS.find((option) => option.id === filters.status) ||
      STATUS_OPTIONS[0];

    return (
      <Listbox
        value={selectedStatus}
        onChange={(value) => setFilters({ ...filters, status: value.id })}
      >
        <div className="relative w-[10rem]">
          <ListboxButton className="relative w-full cursor-pointer rounded-md bg-white py-2 pl-3 pr-10 text-left border focus:outline-none">
            <span className="block truncate text-sm text-gray-700">
              {selectedStatus.name}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {STATUS_OPTIONS.map((option) => (
                <ListboxOption
                  key={option.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active ? "bg-gray-200 text-blue-900" : "text-gray-900"
                    }`
                  }
                  value={option}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {option.name}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                          <Check className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    );
  };


  return (
    <div className="space-y-4 bg-white rounded-lg h-full">
      {/* Filters */}
      <div className="flex items-center">
        <div className="flex items-center w-full justify-between space-x-2 p-2">
          <div className="relative flex-1 md:flex md:h-[2.7rem] xl:h-[3rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-500" />
            <Input
              placeholder="Search payments..."
              className="pl-10 w-full md:w-[70%] xl:w-[50%] md:h-full rounded-full text-gray-600 text-base"
              value={filters.search || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  search: e.target.value,
                })
              }
            />
          </div>
            <StatusFilter />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm md:text-base lg:landscape:text-sm font-medium text-gray-600 uppercase tracking-wide">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-sm md:text-base lg:landscape:text-sm font-medium text-gray-600 uppercase tracking-wide">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-sm md:text-base lg:landscape:text-sm font-medium text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm md:text-base lg:landscape:text-sm font-medium text-gray-600 uppercase tracking-wide">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-sm md:text-base lg:landscape:text-sm font-medium text-gray-600 uppercase tracking-wide">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm md:text-base lg:landscape:text-sm font-medium text-gray-600 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.results.map((payment) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 text-gray-900 text-sm md:text-base lg:landscape:text-[0.9rem] whitespace-nowrap">
                  {payment.reference}
                </td>
                <td className="px-6 py-4 text-gray-900 text-sm md:text-base lg:landscape:text-[0.9rem] whitespace-nowrap">
                  ${payment.amount.toFixed(2)}
                  {payment.payment_currency !== "USD" && (
                    <span className="text-sm text-gray-500 ml-1">
                      ({payment.payment_currency})
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs whitespace-nowrap">
                  <PaymentStatusBadge status={payment.status} />
                </td>
                <td className="px-6 py-4 text-gray-900 text-sm md:text-base lg:landscape:text-[0.9rem] whitespace-nowrap">
                  {payment.customer_email}
                </td>
                <td className="px-6 py-4 text-sm md:text-base lg:landscape:text-[0.9rem] text-gray-900 whitespace-nowrap">
                  {format(new Date(payment.created_at), "PPp")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/admin/payments/${payment.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}