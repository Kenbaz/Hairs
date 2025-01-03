'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Loader2, TrendingUp, DollarSign, ShoppingBag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { adminDashboardService } from '@/src/libs/services/adminServices/adminDashboardService';
import type { RevenueData } from '@/src/types';


interface StatCardProps {
    title: string;
    value: string;
    trend?: number;
    icon: React.ReactNode;
}

interface TimeRangeOption {
    label: string;
    value: number;
}


const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon }) => {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">{icon}</div>
            <div>
              <p className="text-sm text-gray-500">{title}</p>
              <p className="text-xl font-semibold">{value}</p>
            </div>
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center ${
                trend >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp
                className={`h-4 w-4 ${trend < 0 ? "transform rotate-180" : ""}`}
              />
              <span className="ml-1 text-sm">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    );
};


const timeRangeOptions: TimeRangeOption[] = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];


export function RevenueChart() {
  const [timeRange, setTimeRange] = useState<number>(30);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['revenueAnalytics', timeRange],
    queryFn: () => adminDashboardService.getSalesAnalytics('daily', timeRange),
    refetchInterval: 300000, // every 5 minutes
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };


  const calculateTrend = (data: RevenueData[]): number => {
    if (data.length < 2) return 0;
    const firstHalfOfData = data.slice(0, Math.floor(data.length / 2));
    const secondHalfOfData = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalfOfData.reduce((sum, item) => sum + item.total_sales, 0) / firstHalfOfData.length;
    const secondAvg = secondHalfOfData.reduce((sum, item) => sum + item.total_sales, 0) / secondHalfOfData.length;

    return Number((((secondAvg - firstAvg) / firstAvg) * 100).toFixed(1));
  };


  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  };


  if (error || !data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-500">
          Failed to load revenue data
        </div>
      </div>
    );
  };


  const trend = calculateTrend(data.data);


  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Revenue Overview</h2>
          <div className="flex items-center space-x-2">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeRange === option.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(data.total_sales)}
            trend={trend}
            icon={<DollarSign className="h-5 w-5 text-blue-600" />}
          />
          <StatCard
            title="Orders"
            value={data.order_count.toString()}
            icon={<ShoppingBag className="h-5 w-5 text-blue-600" />}
          />
          <StatCard
            title="Average Order"
            value={formatCurrency(data.average_order_value)}
            icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          />
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="period"
                tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                tickFormatter={(value) => `$${value}`}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-4 shadow-lg rounded-lg border">
                        <p className="text-gray-600">
                          {format(parseISO(payload[0].payload.period), 'MMM d, yyyy')}
                        </p>
                        <p className="text-lg font-semibold text-blue-600">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payload[0].payload.order_count} orders
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="total_sales"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}