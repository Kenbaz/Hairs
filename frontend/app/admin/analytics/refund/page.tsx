'use client'

import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import RefundReport from "@/app/_components/dashboardUI/analyticsSection/RefundReport";

export default function RefundReportPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Breadcrumb />
      </div>
      <RefundReport />
    </div>
  );
}
