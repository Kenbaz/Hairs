"use client";

import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import CustomerDetails from "@/app/_components/dashboardUI/customerSection/CustomerDetails";
import { use } from "react";

interface CustomerDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CustomerDetailsPage({
  params,
}: CustomerDetailsPageProps) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <CustomerDetails customerId={Number(id)} />
    </div>
  );
}
