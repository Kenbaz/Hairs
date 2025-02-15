"use client";

import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import AdminProfile from "@/app/_components/dashboardUI/profileSection/AdminProfile";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/src/libs/customHooks/useAuth";

export default function ProfilePage() {
  const { isAuthenticated } = useAuth();
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
    <div className="space-y-6 md:mt-4 xl:-mt-4 md:h-screen">
      <div className="px-2">
        <Breadcrumb />
      </div>

      <AdminProfile />
    </div>
  );
}
