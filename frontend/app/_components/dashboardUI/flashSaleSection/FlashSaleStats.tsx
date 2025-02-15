'use client';

import { useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminFlashSaleService } from "@/src/libs/services/adminServices/adminFlashService";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2, Users, Package, DollarSign, Clock, Check, ChevronDown } from "lucide-react";
import { PriceDisplay } from "@/app/_components/UI/PriceDisplay";
import { Alert } from "@/app/_components/UI/Alert";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  Listbox,
  Transition,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";


// Add ValueDisplay component for handling PriceDisplay values
interface ValueDisplayProps {
  value: React.ReactNode;
  className?: string;
}

const ValueDisplay = ({ value, className = "" }: ValueDisplayProps) => (
  <span className={className}>{value}</span>
);

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactElement;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = ({
  title,
  value,
  icon,
  description,
  trend,
}: StatCardProps) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[0.9rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
        {trend && (
          <p
            className={`mt-2 text-sm ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </p>
        )}
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">{icon}</div>
    </div>
  </div>
);


interface FlashSaleStatsProps {
  flashSaleId: number;
}


const timeRangeOptions = [
  { id: "hourly", name: "By Hour" },
  { id: "daily", name: "By Day" },
] as const;

type TimeRange = (typeof timeRangeOptions)[number]["id"];


export default function FlashSaleStats({ flashSaleId }: FlashSaleStatsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("hourly");


  // Get flash sale details
  const { data: flashSale, isLoading: isLoadingSale } = useQuery({
    queryKey: ["flashSale", flashSaleId],
    queryFn: () => adminFlashSaleService.getFlashSale(flashSaleId),
  });


  // Get flash sale statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["flashSaleStats", flashSaleId],
    queryFn: () => adminFlashSaleService.getStatistics(flashSaleId),
    refetchInterval: flashSale?.status === "active" ? 60000 : undefined, // Refresh every minute only for active sales
  });


  // Get customer purchases
  const { data: purchases, isLoading: isLoadingPurchases } = useQuery({
    queryKey: ["flashSalePurchases", flashSaleId],
    queryFn: () => adminFlashSaleService.getCustomerPurchases(flashSaleId),
  });


  // const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   setTimeRange(e.target.value as "hourly" | "daily");
  // };


  const TimeRangeSelect = () => {
    const selectedRange = timeRangeOptions.find(
      (option) => option.id === timeRange
    );

    return (
      <div className="w-40">
        <Listbox
          value={selectedRange}
          onChange={(value) => setTimeRange(value.id)}
        >
          <div className="relative mt-1">
            <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none">
              <span className="block truncate text-sm text-gray-900">
                {selectedRange?.name}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDown
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </ListboxButton>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {timeRangeOptions.map((option) => (
                  <ListboxOption
                    key={option.id}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                        active ? "bg-gray-200 text-blue-900" : "text-gray-900"
                      }`
                    }
                    value={option}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {option.name}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </div>
        </Listbox>
      </div>
    );
  };


  const isLoading = isLoadingSale || isLoadingStats || isLoadingPurchases;


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!flashSale || !stats) {
    return <Alert type="error" message="Failed to load flash sale data" />;
  }

  const remainingTime = new Date(flashSale.end_time).getTime() - Date.now();
  const isActive = flashSale.status === "active";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {flashSale.name}
            </h1>
            <p className="mt-1 text-gray-500">
              {format(parseISO(flashSale.start_time), "MMM d, yyyy h:mm a")} -{" "}
              {format(parseISO(flashSale.end_time), "MMM d, yyyy h:mm a")}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm md:text-base lg:landscape:text-[0.9rem] font-medium ${
              isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {flashSale.status}
          </div>
        </div>
        {isActive && remainingTime > 0 && (
          <p className="mt-4 text-sm font-medium text-gray-600">
            Time remaining: {formatDistanceToNow(new Date(flashSale.end_time))}
          </p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={
            <ValueDisplay
              value={
                <PriceDisplay
                  amount={stats.metrics.total_revenue}
                  sourceCurrency="USD"
                />
              }
            />
          }
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
        />
        <StatCard
          title="Total Orders"
          value={stats.metrics.total_customers}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          description="Unique customers"
        />
        <StatCard
          title="Products Sold"
          value={`${stats.metrics.total_sold} units`}
          icon={<Package className="h-6 w-6 text-blue-600" />}
          description={`${stats.metrics.products_sold_out} products sold out`}
        />
        <StatCard
          title="Remaining Stock"
          value={stats.metrics.remaining_quantity || "Unlimited"}
          icon={<Clock className="h-6 w-6 text-blue-600" />}
          description="Total quantity remaining"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Top Products
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.top_products}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="product_name"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity_sold" name="Units Sold" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sales Over Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Sales Over Time
          </h2>
          <div className="mb-4">
            <TimeRangeSelect/>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={purchases}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="purchase_date"
                tickFormatter={(date) =>
                  format(
                    new Date(date),
                    timeRange === "hourly" ? "HH:mm" : "MMM d"
                  )
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) =>
                  format(new Date(date), "MMM d, yyyy HH:mm")
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="quantity"
                name="Units Sold"
                stroke="#0088FE"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Recent Purchases
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 uppercase tracking-wide">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 uppercase tracking-wide">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 uppercase tracking-wide">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 uppercase tracking-wide">
                  Price Paid
                </th>
                <th className="px-6 py-3 text-left text-xs md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 uppercase tracking-wide">
                  Purchase Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases?.map((purchase, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm  md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-900">
                      {purchase.customer_name}
                    </div>
                    <div className="text-sm  md:text-base lg:landscape:text-[0.9rem] text-gray-500">
                      {purchase.customer_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm  md:text-base lg:landscape:text-[0.9rem] text-gray-900">
                      {purchase.product_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm  md:text-base lg:landscape:text-[0.9rem] text-gray-900">
                      {purchase.quantity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PriceDisplay
                      amount={purchase.price_paid}
                      sourceCurrency="USD"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm  md:text-base lg:landscape:text-[0.9rem] text-gray-900">
                      {format(
                        new Date(purchase.purchase_date),
                        "MMM d, yyyy HH:mm"
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!purchases || purchases.length === 0) && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No purchases yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
