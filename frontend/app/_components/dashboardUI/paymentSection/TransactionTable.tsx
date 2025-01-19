'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminPaymentService } from '@/src/libs/services/adminServices/adminPaymentService';
import { format } from 'date-fns';
import { Input } from '../../UI/Input';
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
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              placeholder="Search reference..."
              value={filters.payment_reference || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  payment_reference: e.target.value,
                })
              }
              className="w-64"
            />
            <Input
              type="date"
              value={filters.start_date || ""}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.results.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.payment_reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.transaction_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.customer_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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