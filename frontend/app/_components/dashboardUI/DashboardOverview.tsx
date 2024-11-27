import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
// import axiosInstance from '@/src/utils/_axios';
import { DashboardStats } from "@/app/_components/dashboardUI/DashboardStats";
import { RecentOrders } from "@/app/_components/dashboardUI/RecentOrdersOverview";
import { LowStockAlerts } from "@/app/_components/dashboardUI/LowStockAlert";
import { RevenueChart } from "@/app/_components/dashboardUI/RevenueChart";
import { ProductPerformance } from "@/app/_components/dashboardUI/ProductAnalyticsOverview";
import { adminDashboardService } from '@/src/libs/services/adminDashboardService';


// Fetch dashboard statistics 
// const useDashboardStats = () => {
//     return useQuery({
//         queryKey: ['dashboardStats'],
//         queryFn: async () => {
//             const response = await axiosInstance.get('/api/v1/admin/dashboard/statistics/');
//             return response.data;
//         },
//         refetchInterval: 300000,
//     });
// };


export default function DashboardOverview() {
    const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => adminDashboardService.getStats(),
    refetchInterval: 300000, // 5 minutes
  });

    if (isLoading) {
      return (
        <div className="w-full h-96 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full p-4 text-red-500 bg-red-50 rounded-lg">
          Failed to load dashboard data
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Page Title */}
        <div className="px-2">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>

        {/* Key Metrics */}
        <div className="px-2">
        {stats && <DashboardStats stats={stats} />}
      </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2">
          {/* Left Column */}
          <div className="space-y-6">
            <RecentOrders />
            <LowStockAlerts />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <RevenueChart />
            <ProductPerformance />
          </div>
        </div>
      </div>
    );
}