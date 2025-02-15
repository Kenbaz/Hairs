'use client';

import { RevenueReport } from "./Sales&RevenueAnalytics";
import { Breadcrumb } from "../../UI/Breadcrumb";


export default function RevenueReportPage() {
  return (
    <div className="space-y-6 px-2 md:px-0 pb-[10%] md:mt-4 xl:-mt-4">
      <div className="flex justify-between">
        <Breadcrumb />
      </div>
      <RevenueReport />
    </div>
  );
}