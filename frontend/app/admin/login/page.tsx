'use client';

import { AdminLoginForm } from "@/app/_components/_authForms/AdminLoginForm";
import { AuthLayout } from "@/app/_components/_authForms/AuthLayout";
import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/libs/customHooks/useAuth";


export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginContent() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isAuthenticated, isAdmin, router]);

  return (
    <AuthLayout>
      <div className="flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
        <p className="text-gray-600">
          Please log in to access the admin dashboard
        </p>
        <AdminLoginForm />
      </div>
    </AuthLayout>
  );
}