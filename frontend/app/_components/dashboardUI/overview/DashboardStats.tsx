import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package, LucideIcon } from 'lucide-react';
import { DashboardStats as DashboardStatsType } from '@/src/types';


interface StatCardProps {
    title: string;
    value: string | number;
    trend: 'up' | 'down';
    icon: LucideIcon;
    trendValue?: number;
}

interface DashboardStatsProps {
    stats: DashboardStatsType;
}


const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon: Icon, trendValue }) => {
    const isPositive = trend === 'up';

    return (
      <div className="bg-white p-6 lg:pl-2 rounded-lg shadow-sm">
        <div className="flex items-center justify-between relative">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${
                isPositive ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <Icon
                className={`h-6 w-6 lg:landscape:h-5 lg:landscape:w-5 xl:hidden ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              />
              <Icon
                className={`hidden xl:block h-6 w-6 ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              />
            </div>
            <div>
              <p className="text-base lg:landscape:text-sm xl:hidden  fomt-medium text-gray-600">
                {title}
              </p>
              <p className="text-2xl md:text-3xl xl:hidden lg:landscape:text-xl text-gray-800 font-semibold">
                {value}
              </p>
              <p className="hidden xl:block text-base fomt-medium text-gray-600">
                {title}
              </p>
              <p className="hidden xl:block text-2xl text-gray-800 font-semibold">
                {value}
              </p>
            </div>
          </div>
          {trendValue !== undefined && (
            <div
              className={`flex items-center lg:absolute 2xl:relative lg:-top-4 lg:-right-3 space-x-1 ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {trendValue.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
};


export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

  const calculateGrowthPercentage = (current: number, total: number): number => {
    return total > 0 ? (current / total) * 100 : 0;
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Revenue"
        value={formatCurrency(stats.total_revenue)}
        icon={DollarSign}
        trend={stats.sales_growth >= 0 ? "up" : "down"}
        trendValue={stats.sales_growth}
      />

      <StatCard
        title="Total Orders"
        value={stats.total_orders}
        icon={ShoppingBag}
        trend="up"
        trendValue={calculateGrowthPercentage(
          stats.recent_orders,
          stats.total_orders
        )}
      />

      <StatCard
        title="Total Customers"
        value={stats.total_customers}
        icon={Users}
        trend="up"
        trendValue={calculateGrowthPercentage(
          stats.new_customers_this_month,
          stats.total_customers
        )}
      />

      <StatCard
        title="Low Stock Items"
        value={stats.low_stock_products}
        icon={Package}
        trend="down"
        trendValue={calculateGrowthPercentage(
          stats.low_stock_products,
          stats.total_products
        )}
      />
    </div>
  );
}