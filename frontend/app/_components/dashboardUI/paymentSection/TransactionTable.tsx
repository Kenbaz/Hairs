'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminPaymentService } from '@/src/libs/services/adminServices/adminPaymentService';
import { format } from 'date-fns';
import { Input } from '../../UI/Input';
import { Search } from 'lucide-react';
import { TransactionFilters } from '@/src/types';


export function TransactionTable() {
    const [filters, setFilters] = useState<TransactionFilters>({
        page: 1,
        page_size: 10,
    });

    const { data } = useQuery({
        queryKey: ['transactions', filters],
        queryFn: () => adminPaymentService.getTransactionLogs(filters)
    });


    return (
      <div className="space-y-4 bg-white h-[93%] rounded-lg">
        {/* Filters */}
        <div className="grid grid-cols-1 md:flex items-center justify-between p-2 space-y-4">
          <div className="flex w-full items-center justify-between space-x-4">
            <div className="relative flex-1 md:flex md:h-[2.7rem] xl:h-[3rem]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-500" />
              <Input
                placeholder="Search reference..."
                type="text"
                className="pl-10 w-full md:h-full rounded-full text-gray-600 text-base"
                value={filters.payment_reference || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    payment_reference: e.target.value,
                  })
                }
              />
            </div>
            <div className="hidden md:grid grid-cols-2 items-center gap-3 w-[50%]">
              <Input
                type="date"
                value={filters.start_date || ""}
                className="border rounded-lg text-gray-900"
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    start_date: e.target.value,
                  })
                }
              />
              <Input
                type="date"
                value={filters.end_date || ""}
                className="border rounded-lg text-gray-900"
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    end_date: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:hidden items-center gap-3 w-full">
            <Input
              type="date"
              value={filters.start_date || ""}
              className="border rounded-lg text-gray-900"
              onChange={(e) =>
                setFilters({
                  ...filters,
                  start_date: e.target.value,
                })
              }
            />
            <Input
              type="date"
              value={filters.end_date || ""}
              className="border rounded-lg text-gray-900"
              onChange={(e) =>
                setFilters({
                  ...filters,
                  end_date: e.target.value,
                })
              }
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-[0.8rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 uppercase tracking-wide">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-[0.8rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 uppercase tracking-wide">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-[0.8rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-[0.8rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 uppercase tracking-wide">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-[0.8rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 uppercase tracking-wide">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-[0.8rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.results.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 text-gray-900 text-sm md:text-base lg:landscape:text-sm whitespace-nowrap">
                    {transaction.payment_reference}
                  </td>
                  <td className="px-6 py-4 text-gray-900 text-sm md:text-base lg:landscape:text-sm whitespace-nowrap">
                    {transaction.transaction_type}
                  </td>
                  <td className="px-6 py-4 text-gray-900 text-sm md:text-base lg:landscape:text-sm whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === "success"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 text-sm md:text-base lg:landscape:text-sm whitespace-nowrap">
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-gray-900 text-sm md:text-base lg:landscape:text-sm whitespace-nowrap">
                    {transaction.customer_email}
                  </td>
                  <td className="px-6 py-4 text-gray-900 text-sm md:text-base lg:landscape:text-sm whitespace-nowrap">
                    {format(new Date(transaction.created_at), "PPp")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
}