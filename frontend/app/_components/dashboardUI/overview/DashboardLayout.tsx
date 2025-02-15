'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, ChevronDown, LogOut } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/src/libs/_redux/hooks';
import { selectUser, loadUser, logout } from '@/src/libs/_redux/authSlice';
import Link from 'next/link';
import { DashboardNav } from '../../UI/AdminNavItems';
import { NotificationCenter } from './NotificationCenter';
import { notificationService } from '@/src/libs/services/adminServices/notificationService';
import { SessionManager } from '@/src/libs/auth/sessionManager';
import { CurrencySelector } from '../../UI/CurrencySelector';
import Image from 'next/image';


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
      const initializeDashboard = async () => {
        try {
          // Load user data
          await dispatch(loadUser()).unwrap();

          // Start session manager
          SessionManager.getInstance().startSession();

          // Connect notification service
          notificationService.connect();
        } catch (error) {
          console.error('Failed to load user data:', error);
          // If initialization fails, logout user
          dispatch(logout());
        } finally {
          setIsLoading(false);
        }
      };
      
    initializeDashboard();

    // Cleanup function
    return () => { 
      // End session monitoring
      SessionManager.getInstance().endSession();
      
      // Disconnect notification service
      notificationService.disconnect();
    }
    }, [dispatch]);
    

    // Close mobile menu on path change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);
  
    const handleLogout = () => {
      dispatch(logout())
    }

  
    if (isLoading) {
      return <div></div>
    }

    return (
      <div className="h-screen overflow-hidden bg-GreyClear sm:grid lg:grid-style">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 h-screen
            w-64 bg-customWhite3 border-r shadow-xl lg:shadow-none border-gray-200
            transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:static
            flex flex-col
          `}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            <div className="flex items-center space-x-2">
              <Image
                src="/Mizviv-Logo.jpg"
                priority
                alt="Admin Logo"
                width={50}
                height={50}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="rounded-full"
              />
              <Link href="/admin/dashboard" className="flex items-center ">
                <span className="text-lg lg:landscape:text-base text-gray-700 font-bold">
                  Miz Viv Hairs
                </span>
              </Link>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation with Scrolling */}
          <div className="flex-1 overflow-y-auto">
            <DashboardNav />
          </div>
        </aside>

        {/* Main Content */}
        <div className={`flex-1 overflow-auto layout-container ${isSidebarOpen ? "" : ""}`}>
          {/* Top Navigation */}
          <header className="h-16 fixed top-0 right-0 z-20 w-full bg-customWhite3 border-b">
            <div className="h-full px-4 gap-3 flex items-center justify-between">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-md lg:hidden hover:bg-gray-100"
                >
                  <Menu className="h-5 w-5 text-gray-700" />
                </button>

                {/* Search Bar */}
                <div className="ml-4 lg:ml-[26vw] xl:ml-[21vw] 2xl:ml-[17vw]">
                  <CurrencySelector />
                </div>
              </div>

              {/* Right Side Items */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div>
                  <NotificationCenter />
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    className="flex items-center space-x-2 md:space-x-3 px-2 py-1 md:py-2 rounded-full hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    {user?.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt="User Avatar"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <>
                        <div className="w-8 h-8 md:text-base rounded-full bg-gray-50 flex items-center justify-center text-gray-900 lg:landscape:text-sm xl:hidden">
                          {user?.first_name?.[0]}
                        </div>
                        <div className="hidden w-8 h-8 text-base rounded-full bg-gray-50 items-center justify-center text-gray-900 xl:flex">
                          {user?.first_name?.[0]}
                        </div>
                      </>
                    )}
                    <>
                      <span className="md:inline md:text-base text-gray-900 lg:landscape:text-sm xl:hidden">
                        {user?.first_name} {user?.last_name}
                      </span>
                      <span className="hidden xl:inline text-base text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </span>
                    </>

                    <ChevronDown className="h-4 w-4 text-gray-900" />
                  </button>

                  {/* User Dropdown Menu */}
                  {isMobileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg md:text-base lg:landscape:text-sm shadow-lg xl:overide text-gray-700 border-gray-300 border py-2">
                      <Link
                        href="/admin/profile"
                        className="block px-2 py-2 hover:bg-gray-50 w-[95%] rounded-md mx-auto"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="block px-2 py-2 hover:bg-gray-50 w-[95%] rounded-md mx-auto lg:landscape:text-sm xl:overide"
                      >
                        Settings
                      </Link>
                      <hr className="my-2 w-[90%] m-auto border-gray-100" />
                      <button
                        className="block px-2 py-2 lg:landscape:text-sm hover:bg-gray-50 w-[95%] rounded-md mx-auto text-red-600 hover:text-red-700 xl:overide"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5 lg:landscape:h-4 lg:landscape:w-4 xl:overide-size inline-block mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="main-container py-4 mt-[14%] h-screen overflow-y-auto md:mt-[4%] md:p-6 max-w-[100%] xl:mt-[6.4%] 2xl:mt-[4.8%]">
            {children}
          </main>
        </div>
      </div>
    );
}