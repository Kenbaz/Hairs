"use client";

import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import AdminProfile from "@/app/_components/dashboardUI/profileSection/AdminProfile";
import { useAppSelector } from "@/src/libs/_redux/hooks";
import { selectIsAuthenticated } from "@/src/libs/_redux/authSlice";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Or return a loading state
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <AdminProfile />
    </div>
  );
}
