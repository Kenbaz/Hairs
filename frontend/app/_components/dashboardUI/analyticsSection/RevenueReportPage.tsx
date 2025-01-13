'use client';

import { RevenueReport } from "./Sales&RevenueAnalytics";
import { Breadcrumb } from "../../UI/Breadcrumb";


export default function RevenueReportPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Breadcrumb />
      </div>
      <RevenueReport />
    </div>
  );
}