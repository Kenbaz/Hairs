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
    return 'Happy late night';
  }
};

export default function DashboardOverview() {
    const user = useAppSelector(selectUser);
    
    const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => adminDashboardService.getStats(),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

    if (isLoading) {
      return (
        <div className="w-full h-96 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
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
      <div className="space-y-6 h-auto pt-[4%] md:pt-[4%] pb-[15%] md:pb-[10%] lg:-mt-[3%] lg:pt-[8%] xl:pt-[3%]">
        {/* Page Title */}
        <div className="px-2 md:space-y-3 lg:landscape:space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 lg:landscape:text-2xl xl:overide-size2">
            Dashboard
          </h1>
          <p className="mt-1 text-base lg:landscape:text-sm xl:overide text-gray-600">
            {getGreetings()}, {user?.first_name}! Welcome to your dashboard.
          </p>
        </div>

        {/* Key Metrics */}
        <div>{stats && <DashboardStats stats={stats} />}</div>

        {/* Two Column Layout */}
        <div className=" grid grid-cols-1 gap-6">
          <div className="hidden xl:grid gap-6 border">
            <RecentOrders />
            <div className="grid-style3 gap-6 min-h-[300px]">
              <RevenueChart />
              <LowStockAlerts />
            </div>
            <ProductPerformance />
          </div>
          {/* Left Column */}
          <div className="space-y-6 xl:hidden">
            <RecentOrders />
            <LowStockAlerts />
          </div>

          {/* Right Column */}
          <div className="space-y-6 xl:hidden">
            <RevenueChart />
            <ProductPerformance />
          </div>
        </div>
      </div>
    );
}