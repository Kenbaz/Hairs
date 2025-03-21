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
    href: "#",
    icon: Settings,
  }
];


interface UserDashboardLayoutProps {
  children: React.ReactNode;
}

export default function UserDashboardLayout({ children }: UserDashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-customWhite mt-[7.8rem] sm:mt-[4.4rem]">
      {/* Mobile Navigation */}
      <div className="lg:hidden bg-white border-b shadow-sm">
        {/* User Info */}
        <div className="px-4 sm:px-10 py-3 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <UserCircle2 className="w-6 h-6 text-gray-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-medium text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="overflow-x-auto sm:px-4 search-input">
          <nav className="flex px-4 py-2 space-x-2 min-w-max">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    isActive
                      ? "border-b border-gray-900 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <item.icon
                    className={`mr-2 h-5 w-5 ${
                      isActive ? "text-gray-700" : "text-gray-400"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop Layout with Grid */}
      <div className="lg:grid lg:grid-cols-[256px_1fr] lg:min-h-screen">
        {/* Desktop Sidebar - Fixed, non-scrolling */}
        <aside className="hidden lg:block bg-white border-r lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
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
                      ? "bg-gray-50 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? "text-gray-900" : "text-gray-400"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content - Scrollable */}
        <main className="lg:overflow-y-auto">
          <div className="max-w-7xl mx-auto py-2 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}