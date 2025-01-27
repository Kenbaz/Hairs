"use client";

import { PropsWithChildren } from "react";
import Image from "next/image";

export function PublicAuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* Container for the auth form */}
      <div className="w-full max-w-md px-6 py-12">
        {/* Logo and branding container */}
        <div className="mb-8 text-center">
          <Image
            src="/Mizviv-Logo.jpg"
            priority
            alt="Admin Logo"
            width={80}
            height={80}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="mx-auto mb-4 rounded-full"
          />
          <h2 className="text-2xl font-bold text-gray-900">Miz Viv Hairs</h2>
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
