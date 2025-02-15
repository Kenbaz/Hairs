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
    <div className="space-y-6 px-2 md:px-0 min-h-screen md:mt-[2%] lg:mt-4 xl:-mt-4">
      <Breadcrumb />
      <CustomerDetails customerId={Number(id)} />
    </div>
  );
}
