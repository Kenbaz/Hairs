'use client';

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";


export function Breadcrumb() {
    const pathname = usePathname();
    const paths = pathname.split('/').filter(Boolean);

    const generateBreadcrumbs = () => {
        return paths.map((path, index) => {
            const href = `/${paths.slice(0, index + 1).join('/')}`;
            const label = path.charAt(0).toUpperCase() + path.slice(1);
            const isLast = index === paths.length - 1;

            return (
                <li key={href} className="flex items-center">
                    <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
                    {isLast ? (
                        <span className="text-gray-700">{label}</span>
                    ) : (
                        <Link
                            href={href}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            {label}
                        </Link>
                    )}
                </li>
            );
        });
    };


    return (
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center">
          <li>
            <Link
              href="/admin/dashboard"
              className="text-gray-600 hover:text-gray-800"
            >
              <Home className="h-4 w-4" />
            </Link>
          </li>
          {generateBreadcrumbs()}
        </ol>
      </nav>
    );
}