"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const EXCLUDED_PATHS = ["admin", "support", "analytics", "marketing"];

export function Breadcrumb() {
  const pathname = usePathname();

  const generateBreadcrumbs = () => {
    const paths = pathname
      .split("/")
      .filter(Boolean)
      .filter((path) => !EXCLUDED_PATHS.includes(path));

    return paths.map((path, index) => {
      // Check if the path segment is a numeric ID
      const isNumericId = /^\d+$/.test(path);

      const href = `/admin/${paths.slice(0, index + 1).join("/")}`;
      const label = isNumericId
        ? `#${path}`
        : path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
      const isLast = index === paths.length - 1;

      return (
        <li key={href} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-2 text-gray-500" />
          {isLast || isNumericId ? (
            <span
              className={`text-gray-700 ${
                isNumericId ? "text-gray-500 text-sm" : ""
              }`}
            >
              {label}
            </span>
          ) : (
            <Link href={href} className="text-blue-600 hover:text-blue-800">
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
            className="text-gray-600 text-base hover:text-gray-800"
          >
            <Home className="h-4 w-4 md:h-5 md:w-5" />
          </Link>
        </li>
        {generateBreadcrumbs()}
      </ol>
    </nav>
  );
}
