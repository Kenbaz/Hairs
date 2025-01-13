import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { adminDashboardService } from "@/src/libs/services/adminServices/adminDashboardService";

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
            <span className="ml-1 text-sm">{Math.abs(trend).toFixed(1)}%</span>
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
    queryKey: ["salesAnalytics", timeRange],
    queryFn: () =>
      adminDashboardService.getSalesOverview({
        days: timeRange,
        period: "daily",
      }),
    refetchInterval: 300000, // every 5 minutes
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-500">
          Failed to load revenue data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Revenue Overview
          </h2>
          <div className="flex items-center space-x-2">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeRange === option.value
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Sales"
            value={formatCurrency(data.summary.total_sales)}
            trend={data.comparison.growth_rate}
            icon={<DollarSign className="h-5 w-5 text-blue-600" />}
          />
          <StatCard
            title="Total Orders"
            value={data.summary.total_orders.toString()}
            icon={<ShoppingBag className="h-5 w-5 text-blue-600" />}
          />
          <StatCard
            title="Unique Customers"
            value={data.summary.total_customers.toString()}
            icon={<Users className="h-5 w-5 text-blue-600" />}
          />
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.trend_data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="period"
                tickFormatter={(value) => format(parseISO(value), "MMM d")}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                tickFormatter={(value) => `$${value.toLocaleString()}`}
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
                          {format(
                            parseISO(payload[0].payload.period),
                            "MMM d, yyyy"
                          )}
                        </p>
                        <p className="text-lg font-semibold text-blue-600">
                          {formatCurrency(payload[0].payload.total_sales)}
                        </p>
                        <div className="text-sm text-gray-500 mt-1">
                          <p>{payload[0].payload.order_count} orders</p>
                          <p>{payload[0].payload.unique_customers} customers</p>
                          <p>
                            Avg. Order:{" "}
                            {formatCurrency(payload[0].payload.average_order)}
                          </p>
                        </div>
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
