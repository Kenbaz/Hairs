'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { DashboardStats } from "@/app/_components/dashboardUI/overview/DashboardStats";
import { RecentOrders } from "@/app/_components/dashboardUI/overview/RecentOrdersOverview";
import { LowStockAlerts } from "@/app/_components/dashboardUI/overview/LowStockAlert";
import { RevenueChart } from "@/app/_components/dashboardUI/overview/RevenueChart";
import { ProductPerformance } from "@/app/_components/dashboardUI/overview/ProductAnalyticsOverview";
import { adminDashboardService } from '@/src/libs/services/adminServices/adminDashboardService';
import { useAppSelector } from "@/src/libs/_redux/hooks";
import { selectUser } from "@/src/libs/_redux/authSlice";


const getGreetings = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'Good evening';
  } else {
    return 'Good night';
  }
};

export default function DashboardOverview() {
    const user = useAppSelector(selectUser);
    
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
          <p className="mt-1 text-sm text-gray-600">
            {getGreetings()}, {user?.first_name}! Welcome to your dashboard.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="px-2">{stats && <DashboardStats stats={stats} />}</div>

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