// app/admin/dashboard/page.tsx
'use client';


import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import DashboardOverview from "@/app/_components/dashboardUI/DashboardOverview";

export default function DashboardPage() {
  return (
    <div className="">
      <div className="px-2">
        <Breadcrumb />
      </div>

      {/* Dashboard content */}
      <DashboardOverview/>
    </div>
  );
}
