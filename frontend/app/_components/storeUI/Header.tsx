"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  User,
  X,
  Package,
  Heart,
  LogOut,
  Store,
  Phone,
  Search,
} from "lucide-react";
import Image from "next/image";
import { useAppDispatch } from "@/src/libs/_redux/hooks";
import { openCart } from "@/src/libs/_redux/cartSlice";
import { openWishlist } from "@/src/libs/_redux/wishlistUISlice";
import { useAuth } from "@/src/libs/customHooks/useAuth";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { CartIndicator } from "../cartUI/CartIndicator";
import { WishlistIndicator } from "../wishlistUI/WislistIndicator";
import { logout } from "@/src/libs/_redux/authSlice";
import { RegionSelector } from "./RegionSelector";
import { UserMenu } from "./UserMenu";
import { productService } from "@/src/libs/services/customerServices/productService";
import { useDebounce } from "@/src/libs/customHooks/useDebounce";
import { SearchDropdown } from "./SearchDropdown";
import { InstantSearchResult } from "@/src/types";

export function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InstantSearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchQuery, 300);

  // Handle search results
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (debouncedSearchTerm.trim().length > 1) {
        try {
          const results = await productService.instantSearch(
            debouncedSearchTerm
          );
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };

    fetchSearchResults();
  }, [debouncedSearchTerm]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/shop/products?search=${encodeURIComponent(searchQuery.trim())}`
      );
      setIsSearchFocused(false);
    }
  };

  const handleSelectSearchItem = () => {
    setIsSearchFocused(false);
    setSearchQuery("");
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const navigationLinks = [
    { href: "/shop/products", label: "Products", icon: Store },
    { href: "#", label: "Contact", icon: Phone },
  ];

  const userMenuItems = [
    { label: "My Profile", href: "/shop/dashboard/profile", icon: User },
    { label: "My Orders", href: "/shop/dashboard/orders", icon: Package },
    { label: "My Wishlist", href: "/shop/dashboard/wishlist", icon: Heart },
  ];

  return (
    <>
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleMobileMenu}
            />

            {/* Sidebar Content */}
            <motion.div
              className="fixed inset-y-0 left-0 w-[80%] sm:w-[50%] bg-white shadow-lg z-50 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "tween",
                duration: 0.3,
              }}
            >
              <div className="py-4 relative px-5 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold ml-[12%] text-black">
                  Hairs
                </h2>
                <button onClick={toggleMobileMenu} className="absolute">
                  <X className="h-6 w-6 text-black font-bold" />
                </button>
              </div>

              {/* User Section */}
              <div className="p-5 border-b">
                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                ) : (
                  <Link href="/auth/login" onClick={toggleMobileMenu}>
                    <button className="w-full bg-customBlack text-white flex items-center justify-center py-3 rounded-lg">
                      <User className="h-4 w-4 mr-2" />
                      Login
                    </button>
                  </Link>
                )}
              </div>

              {/* User Menu Items */}
              {isAuthenticated && (
                <div className="py-4 px-5 border-t border-b">
                  <h3 className="text-base font-medium text-gray-700 mb-4">
                    My Account
                  </h3>
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center py-4 text-gray-800 hover:bg-gray-50 rounded"
                      onClick={toggleMobileMenu}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              {/* Navigation Links */}
              <nav className="p-5 mb-[18%]">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center py-4 text-gray-800 hover:bg-gray-50 rounded"
                    onClick={toggleMobileMenu}
                  >
                    <link.icon className="h-5 w-5 mr-3" />
                    {link.label}
                  </Link>
                ))}
              </nav>

              {isAuthenticated && (
                <button
                  onClick={() => {
                    dispatch(logout());
                    toggleMobileMenu();
                  }}
                  className="flex items-center font-medium w-full px-5 py-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              )}

              {/* Region Selector */}
              <div className="p-6">
                <h3 className="text-base font-medium text-gray-700 mb-2">
                  Select Region
                </h3>
                <div>
                  <RegionSelector variant="mobile" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header className="bg-white fixed top-0 z-40 w-full shadow-sm pb-[0.6rem] xl:px-[4%]">
        <div className="-mb-2">
          {/* Main Header */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center lg:space-x-4 justify-between h-16">
              <div className="flex items-center space-x-3">
                {/* Hamburger Menu */}
                <button className="lg:hidden p-2" onClick={toggleMobileMenu}>
                  <Menu className="h-6 w-6 text-gray-700" />
                </button>

                {/* Logo */}
                <Link href="/" className="flex-shrink-0">
                  <h1 className="text-2xl font-bold text-gray-900">Hairs</h1>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex space-x-8">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-800 hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Search Bar */}
              <div
                ref={searchContainerRef}
                className="w-full hidden sm:block max-w-lg mx-auto px-4 mt-2 relative"
              >
                <form onSubmit={handleSearch} className="w-full relative">
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    className="pl-10 pr-10 bg-white text-gray-900 py-3 border focus:ring-gray-200 focus:ring-1"
                  />
                  <Search className="absolute text-gray-400 shadow-sm hover:text-gray-600 top-[23%] left-2" />
                </form>

                {isSearchFocused && searchResults.length > 0 && (
                  <SearchDropdown
                    results={searchResults}
                    onSelectItem={handleSelectSearchItem}
                  />
                )}
              </div>

              <div className="hidden xl:block">
                <RegionSelector />
              </div>

              {/* Right Actions */}
              <div className="flex items-center space-x-4">
                <WishlistIndicator onClick={() => dispatch(openWishlist())} />
                <CartIndicator onClick={() => dispatch(openCart())} />

                {/* Desktop User Menu */}
                {isAuthenticated ? (
                  <div className="hidden lg:block">
                    <UserMenu />
                  </div>
                ) : (
                  <Link href="/auth/login" className="hidden lg:block">
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="sm:hidden">
          {/* Search Bar */}
          <div
            ref={searchContainerRef}
            className="w-full max-w-lg mx-auto px-4 mt-2 relative"
          >
            <form onSubmit={handleSearch} className="w-full relative">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="pl-10 pr-10 rounded-full bg-white text-gray-900 py-3 border focus:ring-gray-200 focus:ring-1"
              />
              <Search className="absolute text-gray-400 shadow-sm hover:text-gray-600 top-[23%] left-2" />
            </form>

            {isSearchFocused && searchResults.length > 0 && (
              <SearchDropdown
                results={searchResults}
                onSelectItem={handleSelectSearchItem}
              />
            )}
          </div>
        </div>
      </header>
    </>
  );
}
