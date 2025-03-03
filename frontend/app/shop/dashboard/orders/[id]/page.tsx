"use client";

import { OrderDetail } from "@/app/_components/pages/OrderDetails";
import { use } from "react";

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const orderId = Number(id);

  if (isNaN(orderId)) {
    return <div>Invalid order ID</div>;
  }

  return (
    <div className="space-y-6">
      <OrderDetail orderId={orderId} />
    </div>
  );
}
