'use client';

import { SalesAnalytics } from "./Sales&RevenueAnalytics";
import { Breadcrumb } from "../../UI/Breadcrumb";


export default function SalesAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Breadcrumb />
      </div>
      <SalesAnalytics />
    </div>
  );
};