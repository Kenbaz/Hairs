"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/src/libs/_redux/hooks";
import { DashboardLayout } from "@/app/_components/dashboardUI/overview/DashboardLayout";
import { notificationService } from "@/src/libs/services/adminServices/notificationService";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    notificationService.init(dispatch);
    notificationService.connect();
    return () => notificationService.disconnect();
  }, [dispatch]);

  return <DashboardLayout>{children}</DashboardLayout>;
}
