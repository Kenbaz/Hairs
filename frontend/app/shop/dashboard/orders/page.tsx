"use client";

import { OrderHistory } from "@/app/_components/pages/OrderHistory";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">My Orders</h1>
      </div>
      <OrderHistory />
    </div>
  );
}
