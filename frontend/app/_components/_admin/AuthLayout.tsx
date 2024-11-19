"use client";

import { PropsWithChildren } from "react";
import Image from "next/image";

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* Container for the auth form */}
      <div className="w-full max-w-md px-6 py-12">
        {/* Logo and branding container */}
        <div className="mb-8 text-center">
          <Image
            src="/"
            alt="Admin Logo"
            width={80}
            height={80}
            className="mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage your e-commerce platform
          </p>
        </div>

        {/* Form container */}
        <div className="bg-white shadow-md rounded-lg p-8">{children}</div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            © {new Date().getFullYear()} Miz Viv Hairs. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
