'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, ChevronDown, Search } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/src/libs/_redux/hooks';
import { selectUser, loadUser } from '@/src/libs/_redux/authSlice';
import Link from 'next/link';
import { DashboardNav } from '../UI/AdminNavItems';
import { NotificationCenter } from './NotificationCenter';
import { notificationService } from '@/src/libs/services/notificationService';


interface DashboardLayoutProps {
    children: React.ReactNode;
}


export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);

    
    // Effect to load user data on mount
  useEffect(() => {
      const initializeUser = async () => {
        try {
          await dispatch(loadUser()).unwrap();
        } catch (error) {
          console.error('Failed to load user data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
    initializeUser();
    }, [dispatch]);
    
    
    useEffect(() => {
      notificationService.connect();
      return () => notificationService.disconnect();
    }, []);

    // Close mobile menu on path change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

  
    if (isLoading) {
      return <div></div>
    }

    return (
      <div className="min-h-screen bg-customWhite2 flex">
        {/* Sidebar */}
        <aside
          className={`
    fixed inset-y-0 left-0 z-50 h-screen
    w-64 bg-white border-r border-gray-200
    transition-transform duration-300 ease-in-out
    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0 lg:static
    flex flex-col
  `}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-2"
            >
              <span className="text-xl font-bold">Admin Panel</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation with Scrolling */}
          <div className="flex-1 overflow-y-auto">
            <DashboardNav />
          </div>
        </aside>

        {/* Main Content */}
        <div className={`flex-1 ${isSidebarOpen ? "" : ""}`}>
          {/* Top Navigation */}
          <header className="h-16 bg-customWhite3 border-b border-gray-200">
            <div className="h-full px-4 flex items-center justify-between">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-md lg:hidden hover:bg-gray-100"
                >
                  <Menu className="h-5 w-5" />
                </button>

                {/* Search Bar */}
                <div className="ml-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-full md:w-72 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Right Side Items */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <NotificationCenter/>

                {/* User Menu */}
                <div className="relative">
                  <button
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {user?.first_name?.[0]}
                    </div>
                    <span className="hidden md:inline">
                      {user?.first_name} {user?.last_name}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* User Dropdown Menu */}
                  {isMobileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <Link
                        href="/admin/profile"
                        className="block px-4 py-2 hover:bg-gray-50"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="block px-4 py-2 hover:bg-gray-50"
                      >
                        Settings
                      </Link>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                        // Add logout handler
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="p-4 md:p-6 max-w-[1920px] mx-auto">
            {children}
          </main>
        </div>
      </div>
    );
}