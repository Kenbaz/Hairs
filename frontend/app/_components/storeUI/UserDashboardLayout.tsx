'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle2, Package, Heart, Settings } from "lucide-react";
import { useAuth } from "@/src/libs/customHooks/useAuth";


const navigationItems = [
  {
    name: "Profile",
    href: "/shop/dashboard/profile",
    icon: UserCircle2,
  },
  {
    name: "Orders",
    href: "/shop/dashboard/orders",
    icon: Package,
  },
  {
    name: "Wishlist",
    href: "/shop/dashboard/wishlist",
    icon: Heart,
  },
  {
    name: "Settings",
    href: "/shop/dashboard/settings",
    icon: Settings,
  },
];


interface UserDashboardLayoutProps {
  children: React.ReactNode;
}

export default function UserDashboardLayout({ children }: UserDashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <div className="lg:hidden bg-white border-b shadow-sm">
        {/* User Info */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <UserCircle2 className="w-6 h-6 text-gray-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="overflow-x-auto">
          <nav className="flex px-4 py-2 space-x-2 min-w-max">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <item.icon
                    className={`mr-2 h-5 w-5 ${
                      isActive ? "text-blue-700" : "text-gray-400"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r">
          {/* User Info */}
          <div className="p-6 border-b">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserCircle2 className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="mt-4 font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </h2>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? "text-blue-700" : "text-gray-400"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}