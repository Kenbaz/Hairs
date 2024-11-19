'use client';
import { AdminLoginForm } from "@/app/_components/_authForms/AdminLoginForm";
import { AuthLayout } from "@/app/_components/_authForms/AuthLayout";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/src/libs/_redux/hooks";
import { selectIsAuthenticated, selectIsAdmin } from "@/src/libs/_redux/authSlice";


export default function AdminLoginPage() {
    const router = useRouter();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isAdmin = useAppSelector(selectIsAdmin);

    
    useEffect(() => {
        // Redirect to dashboard if already authenticated as admin
        if (isAuthenticated && isAdmin) {
            router.push('/admin/dashboard');
        }
    }, [isAuthenticated, isAdmin, router]);

    
    return (
        <AuthLayout>
            <div className="flex flex-col items-center justify-center space-y-4">
                <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
                <p className="text-gray-600">Please log in to access the admin dashboard</p>
                <AdminLoginForm/>
            </div>
        </AuthLayout>
    );
}