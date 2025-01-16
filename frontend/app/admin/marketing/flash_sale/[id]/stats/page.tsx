"use client";

import { use } from "react";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import FlashSaleStats from "@/app/_components/dashboardUI/flashSaleSection/FlashSaleStats";

interface FlashSaleStatsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function FlashSaleStatsPage({
  params,
}: FlashSaleStatsPageProps) {
  // Use React.use to unwrap the params promise
  const { id } = use(params);
  const flashSaleId = parseInt(id);

  if (isNaN(flashSaleId)) {
    return <div>Invalid flash sale ID</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <FlashSaleStats flashSaleId={flashSaleId} />
    </div>
  );
}
