"use client";

import { PaymentDetails } from "@/app/_components/dashboardUI/paymentSection/PaymentDetails";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import { use } from 'react';

interface PaymentDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PaymentDetailsPage({
  params,
}: PaymentDetailsPageProps) {
  const { id } = use(params);
  const paymentId = parseInt(id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Breadcrumb />
          <h1 className="text-2xl font-semibold">Payment Details</h1>
        </div>
      </div>
      <PaymentDetails paymentId={paymentId} />
    </div>
  );
}
