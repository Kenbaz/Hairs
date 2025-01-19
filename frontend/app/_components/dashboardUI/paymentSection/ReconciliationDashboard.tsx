'use client';

import { useQuery } from "@tanstack/react-query";
import { adminPaymentService } from "@/src/libs/services/adminServices/adminPaymentService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Alert } from "../../UI/Alert";


interface SummaryCardProps {
    title: string;
    value: string | number;
    subValue?: string;
}

function SummaryCard({ title, value, subValue }: SummaryCardProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
            {subValue && (
                <p className="mt-1 text-sm text-gray-500">{subValue}</p>
            )}
        </div>
    );
}


function formatProcessingTime(time: string | null): string {
  if (!time) return "N/A";
  const duration = new Date(time);
  const hours = duration.getUTCHours();
  const minutes = duration.getUTCMinutes();
  const seconds = duration.getUTCSeconds();

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function ReconciliationDashboard() { 
    const { data, isLoading, error } = useQuery({
        queryKey: ['reconciliation'],
        queryFn: () => adminPaymentService.getPaymentReconciliation()
    });

    if (isLoading)
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      );

    if (error)
      return (
        <Alert type="error" message="Failed to load reconciliation data" />
      );

    if (!data) return null;


    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Total Payments"
                    value={data.summary.total_payments}
                    subValue={`$${data.summary.total_amount.toFixed(2)}`}
                />
                <SummaryCard
                    title="Success Rate"
                    value={`${data.summary.success_rate}%`}
                    subValue={`${data.summary.successful_payments} successful`}
                />
                <SummaryCard
                    title="Average Amount"
                    value={`$${data.summary.average_amount.toFixed(2)}`}
                />
                <SummaryCard
                    title="Processing Time"
                    value={formatProcessingTime(data.summary.average_processing_time)}
                />
            </div>

            {/* Daily Transactions Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Daily Transactions</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.daily_transactions}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                            />
                            <Line
                                type="monotone"
                                dataKey="total_amount"
                                stroke="#8884d8"
                                name="Total Amount"
                            />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#82ca9d"
                                name="Transaction Count"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Payment Method Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.payment_methods}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="payment_method" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8884d8" name="Transactions" />
                                <Bar dataKey="success_count" fill="#82ca9d" name="Successful" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Currency Distribution */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Currency Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.currency_distribution}
                                    dataKey="total_amount"
                                    nameKey="payment_currency"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {data.currency_distribution.map((entry, index) => (
                                        <Cell key={entry.payment_currency} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}