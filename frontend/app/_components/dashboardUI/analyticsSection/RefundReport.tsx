import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { adminAnalyticsService } from "@/src/libs/services/adminServices/adminAnalyticsService";
import { PriceDisplay } from "@/app/_components/UI/PriceDisplay";

const COLORS = ["#3B82F6", "#34D399", "#F87171", "#FBBF24"];

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
}

const DateFilter = ({ startDate, endDate, onDateChange }: DateFilterProps) => (
  <div className="grid grid-cols-2 items-center space-x-2">
    <div>
      <label
        htmlFor="startDate"
        className="block text-sm md:text-base lg:landscape:text-[0.9rem] text-gray-600"
      >
        Start Date
      </label>
      <input
        type="date"
        id="startDate"
        value={startDate}
        onChange={(e) => onDateChange(e.target.value, endDate)}
        className="mt-1 block w-full rounded-md border p-2 text-sm text-gray-900"
      />
    </div>
    <div>
      <label
        htmlFor="endDate"
        className="block text-sm md:text-base lg:landscape:text-[0.9rem] text-gray-600"
      >
        End Date
      </label>
      <input
        type="date"
        id="endDate"
        value={endDate}
        onChange={(e) => onDateChange(startDate, e.target.value)}
        className="mt-1 block w-full rounded-md border p-2 text-sm text-gray-900"
      />
    </div>
  </div>
);

interface StatCardProps {
  title: string;
  value: string | number;
  percentage?: number;
  isCurrency?: boolean;
}

const StatCard = ({ title, value, percentage, isCurrency }: StatCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-[0.9rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600">
      {title}
    </h3>
    <div className="mt-2 flex items-baseline">
      <p className="text-2xl font-semibold text-gray-900">
        {isCurrency ? (
          <PriceDisplay
            amount={Number(value)}
            sourceCurrency="USD"
            showLoader={false}
          />
        ) : (
          value
        )}
      </p>
      {percentage !== undefined && (
        <p className="ml-2 text-sm text-gray-500">{percentage.toFixed(1)}%</p>
      )}
    </div>
  </div>
);

export default function RefundReport() {
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date().setDate(1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["refundReport", dateRange],
    queryFn: () =>
      adminAnalyticsService.getRefundReport({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
  });

  const handleDateChange = (start: string, end: string) => {
    setDateRange({ startDate: start, endDate: end });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500">No refund data available</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-medium text-gray-900">Refund Report</h2>
        <div className="flex items-center space-x-4">
          <DateFilter
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onDateChange={handleDateChange}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Refunds"
          value={data.summary.total_refunds}
          percentage={data.summary.refund_rate}
        />
        <StatCard
          title="Total Amount Refunded"
          value={data.summary.total_amount}
          isCurrency
        />
        <StatCard
          title="Average Refund Amount"
          value={data.summary.average_refund_amount}
          isCurrency
        />
        <StatCard
          title="Average Processing Time"
          value={`${data.summary.processing_time_avg.toFixed(1)} hours`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Refund Reasons Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-[0.9rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 mb-4">
            Refund Reasons
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.reason_breakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="reason" />
                <YAxis
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 shadow-lg rounded-lg border">
                          <p className="font-medium">
                            {payload[0].payload.reason}
                          </p>
                          <p className="text-sm text-gray-500">
                            Count: {payload[0].payload.count}
                          </p>
                          <p className="text-sm text-gray-500">
                            Amount:{" "}
                            <PriceDisplay
                              amount={payload[0].payload.total_amount}
                              sourceCurrency="USD"
                              showLoader={false}
                            />
                          </p>
                          <p className="text-sm text-gray-500">
                            {payload[0].payload.percentage.toFixed(1)}% of
                            refunds
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="percentage"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Refund Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-[0.9rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 mb-4">
            Status Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.reason_breakdown}
                  dataKey="count"
                  nameKey="reason"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                  }) => {
                    const RADIAN = Math.PI / 180;
                    const radius =
                      innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#374151"
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                        className="text-xs"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {data.reason_breakdown.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 shadow-lg rounded-lg border">
                          <p className="font-medium">
                            {payload[0].payload.reason}
                          </p>
                          <p className="text-sm text-gray-500">
                            Count: {payload[0].payload.count}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(
                              (payload[0].payload.count /
                                data.summary.total_refunds) *
                              100
                            ).toFixed(1)}
                            % of total
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Refunds Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-[0.9rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-600 mb-4">
          Recent Refunds
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wide">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.transactions.map((refund) => (
                <tr key={refund.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{refund.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{refund.order_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <PriceDisplay
                      amount={refund.amount}
                      sourceCurrency="USD"
                      showLoader={false}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {refund.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          refund.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : refund.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {refund.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(refund.created_at), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}