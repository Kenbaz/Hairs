"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TooltipProps } from "recharts/types/component/Tooltip";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { format, parseISO } from "date-fns";
import {
  SalesAnalyticsTrendData,
  CategoryRevenue,
} from "@/src/types";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { adminAnalyticsService } from "@/src/libs/services/adminServices/adminAnalyticsService";
import { PriceDisplay } from "../../UI/PriceDisplay";


interface PeriodSelectorProps {
  selectedPeriod: number;
  onPeriodChange: (days: number) => void;
}


const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};


const PeriodSelector = ({
  selectedPeriod,
  onPeriodChange,
}: PeriodSelectorProps): JSX.Element => {
  const periods = [
    { label: "7 Days", value: 7 },
    { label: "30 Days", value: 30 },
    { label: "90 Days", value: 90 },
  ];

  return (
    <div className="flex space-x-2">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${
              selectedPeriod === period.value
                ? "bg-gray-50 text-gray-900"
                : "text-gray-700 hover:bg-gray-50"
            }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};


interface AnalyticsCardProps {
  title: string;
  value: number;
  sourceCurrency?: string;
  trend?: number;
  trendLabel?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
}

const AnalyticsCard = ({
  title,
  value,
  trend,
  sourceCurrency = 'USD',
  trendLabel,
  isPositive,
  icon,
}: AnalyticsCardProps): JSX.Element => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-[0.9rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-500">{title}</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">
            <PriceDisplay
              amount={value}
              sourceCurrency={sourceCurrency}
              showLoader={false}
            />
          </p>
          {trend !== undefined && (
            <div className="ml-2 flex items-center">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`ml-1 text-sm font-medium ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend > 0 ? "+" : ""}
                {trend.toFixed(1)}%
                {trendLabel && (
                  <span className="text-gray-500 ml-1">vs last period</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
      {icon && <div className="p-2 bg-blue-50 rounded-lg">{icon}</div>}
    </div>
  </div>
);


const CustomTooltip = ({
  active,
  payload,
}: TooltipProps<ValueType, NameType>): JSX.Element | null => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload as SalesAnalyticsTrendData;
  return (
    <div className="bg-white p-4 shadow-lg rounded-lg border">
      <p className="font-medium">
        {format(parseISO(data.period), "MMM d, yyyy")}
      </p>
      <p className="text-blue-600 font-medium">
        {formatCurrency(data.total_sales)}
      </p>
      <p className="text-sm text-gray-500">{data.order_count} orders</p>
      <p className="text-sm text-gray-500">{data.unique_customers} customers</p>
      <p className="text-sm text-gray-500">
        Avg. Order: {formatCurrency(data.average_order)}
      </p>
    </div>
  );
};


const CategoryTooltip = ({
  active,
  payload,
}: TooltipProps<ValueType, NameType>): JSX.Element | null => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload as CategoryRevenue;
  return (
    <div className="bg-white p-4 shadow-lg rounded-lg border">
      <p className="font-medium">{data.category}</p>
      <p className="text-blue-600 font-medium">
        {formatCurrency(data.revenue)}
      </p>
      <p className="text-sm text-gray-500">{data.orders} orders</p>
      <p className="text-sm text-gray-500">
        Avg. Order: {formatCurrency(data.average_order_value)}
      </p>
    </div>
  );
};


export function SalesAnalytics() {
    const [period, setPeriod] = useState(30);

    const { data, isLoading, error } = useQuery({
        queryKey: ['salesAnalytics', period],
        queryFn: () => adminAnalyticsService.getSalesAnalytics({ days: period }),
        refetchInterval: 50000,
    });

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
        </div>
      );
    }

    if (error || !data) {
      return (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Failed to load sales analytics data
        </div>
      );
    }


    return (
      <div className="space-y-6 h-[92%]">
        <div className="flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-medium text-gray-900">
            Sales Analytics
          </h2>
          <div className="hidden md:inline-flex">
            <PeriodSelector
              selectedPeriod={period}
              onPeriodChange={setPeriod}
            />
          </div>
        </div>
        <div className="grid ml-[31%] md:hidden">
          <PeriodSelector selectedPeriod={period} onPeriodChange={setPeriod} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnalyticsCard
            title="Total Sales"
            value={data.summary.total_sales}
            sourceCurrency="USD"
            trend={data.comparison.growth_rate}
            trendLabel="vs last period"
            isPositive={data.comparison.growth_rate > 0}
          />
          <AnalyticsCard
            title="Total Orders"
            value={data.summary.total_orders}
            trend={data.comparison.growth_rate}
          />
          <AnalyticsCard
            title="Average Order Value"
            value={data.summary.average_order_value}
            sourceCurrency="USD"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm h-[85%]">
          <div className="">
            <h3 className="text-sm md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-500 mb-4">
              Sales Trend
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend_data}>
                  <defs>
                    <linearGradient
                      id="salesGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(value) => format(parseISO(value), "MMM d")}
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip content={CustomTooltip} />
                  <Area
                    type="monotone"
                    dataKey="total_sales"
                    stroke="#3B82F6"
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
}


export function RevenueReport() {
  const [period, setPeriod] = useState(30);

  const { data, isLoading, error } = useQuery({
    queryKey: ["revenueAnalytics", period],
      queryFn: () => adminAnalyticsService.getRevenueAnalytics({ days: period }),
        refetchInterval: 50000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Failed to load revenue analytics data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-xl font-medium text-gray-900">
          Revenue Report
        </h2>
        <div className="hidden md:inline-flex">
          <PeriodSelector selectedPeriod={period} onPeriodChange={setPeriod} />
        </div>
      </div>

      <div className="grid ml-[31%] md:hidden">
        <PeriodSelector selectedPeriod={period} onPeriodChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnalyticsCard
          title="Total Revenue"
          value={data.summary.total_revenue}
          sourceCurrency="USD"
        />
        <AnalyticsCard
          title="Average Order Value"
          value={data.summary.average_order_value}
          sourceCurrency="USD"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-[0.9rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 mb-4">
            Revenue Trend
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend_data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="period"
                  tickFormatter={(value) => format(parseISO(value), "MMM d")}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={CustomTooltip} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-[0.9rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 mb-4">
            Revenue by Category
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.by_category}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={CategoryTooltip} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
