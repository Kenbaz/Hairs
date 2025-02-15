'use client';

import { SalesAnalytics } from "./Sales&RevenueAnalytics";
import { Breadcrumb } from "../../UI/Breadcrumb";


export default function SalesAnalyticsPage() {
  return (
    <div className="space-y-6 px-2 md:px-0 md:mt-4 md:h-screen xl:-mt-4">
      <div className="flex justify-between">
        <Breadcrumb />
      </div>
      <SalesAnalytics />
    </div>
  );
};