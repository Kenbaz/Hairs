import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { adminDashboardService } from '@/src/libs/services/adminServices/adminDashboardService';
import type { AdminOrder } from '@/src/types';


const OrderStatusBadge = ({ status }: { status: AdminOrder['order_status'] }) => {
    const statusStyles = {
        pending: "bg-yellow-50 text-yellow-600 border-yellow-100",
        processing: "bg-blue-50 text-blue-600 border-blue-100",
        shipped: "bg-purple-50 text-purple-600 border-purple-100",
        delivered: "bg-green-50 text-green-600 border-green-100",
        cancelled: "bg-red-50 text-red-600 border-red-100",
    };

    return (
      <span
        className={`
        px-2.5 py-1 text-base font-medium lg:landscape:text-sm rounded-full border
        ${statusStyles[status]}
      `}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
};


const OrderRow = ({ order }: { order: AdminOrder }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-base tracking-wide lg:landscape:text-sm">
          <Link
            href={`/admin/orders/${order.id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            #{order.id}
          </Link>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700 lg:landscape:text-sm">
          {format(new Date(order.created_at), "MMM d, yyyy h:mm a")}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-base font-medium text-gray-900 lg:landscape:text-sm">
            {order.customer_name}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700 lg:landscape:text-sm">
          {order.items_count} items
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700 lg:landscape:text-sm">
          {formatCurrency(order.total_amount)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <OrderStatusBadge status={order.order_status} />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700 lg:landscape:text-sm">
          <Link
            href={`/admin/orders/${order.id}`}
            className="text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1"
          >
            <span>View</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </td>
      </tr>
    );
};


export function RecentOrders() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['recentOrders'],
        queryFn: () => adminDashboardService.getRecentOrders(5),
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    });
    

    if (isLoading) {
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
            </div>
          </div>
        );
    };


  if (error || !data) {
      console.error("Recent Orders Error:", error);
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-red-500">
            Failed to load recent orders
          </div>
        </div>
      );
    }
    
    // Ensuring there is an orders array even if data.orders is undefined
  const orders = data.results || [];


    return (
      <div className="bg-white overflow-x-hidden max-h-[25rem] overflow-auto rounded-lg shadow">
        <div className="px-6 py-4 border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-medium text-gray-900 lg:landscape:text-base">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm md:text-base text-blue-600 hover:text-blue-800 lg:landscape:text-sm inline-flex items-center space-x-1"
            >
              <span>View all</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {orders.length > 0 ? (
          <div className="overflow-x-auto w-full mx-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 rounded-xl">
                <tr>
                  <th className="px-6 py-3 text-left text-[0.95rem] font-medium text-gray-700 lg:landscape:text-[0.8rem] uppercase">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-[0.95rem] font-medium text-gray-700 lg:landscape:text-[0.8rem] uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-[0.95rem] font-medium text-gray-700 lg:landscape:text-[0.8rem] uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-[0.95rem] font-medium text-gray-700 lg:landscape:text-[0.8rem] uppercase">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-[0.95rem] font-medium text-gray-700 lg:landscape:text-[0.8rem] uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-[0.95rem] font-medium text-gray-700 lg:landscape:text-[0.8rem] uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-[0.95rem] font-medium text-gray-700 lg:landscape:text-[0.8rem] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No recent orders found
          </div>
        )}
      </div>
    );
}