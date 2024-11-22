'use client';

import { DashboardLayout } from "../../_components/dashboardUI/DashboardLayout";
import { useEffect } from "react";
import { notificationService } from "@/src/libs/services/notificationService";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
  }) {
    
  useEffect(() => {
    notificationService.connect();
    return () => notificationService.disconnect();
  }, []);


    return (
        <DashboardLayout>
            {children}
        </DashboardLayout>
    );
}
