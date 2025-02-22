"use client";

import { useState } from "react";
import { useProductsQuery } from "@/src/libs/customHooks/useProducts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, User, X } from "lucide-react";
import { useAppDispatch } from "@/src/libs/_redux/hooks";
import { openCart } from "@/src/libs/_redux/cartSlice";
import { openWishlist } from "@/src/libs/_redux/wishlistUISlice";
import { useAuth } from "@/src/libs/customHooks/useAuth";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { CartIndicator } from "../cartUI/CartIndicator";
import { WishlistIndicator } from "../wishlistUI/WislistIndicator";
import { UserMenu } from "./UserMenu";
import { setSearchQuery } from "@/src/libs/_redux/productSlice";
import { RegionSelector } from "./RegionSelector";

export function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { debouncedSearchQuery, updateSearchQuery } = useProductsQuery();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (debouncedSearchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(debouncedSearchQuery.trim())}`);
    }
  };

  const navigationLinks = [
    { href: "/products", label: "Products" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="bg-white shadow-sm">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-900">Miz Viv Hairs</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <Input
                type="search"
                placeholder="Search products..."
                value={debouncedSearchQuery}
                onChange={(e) => updateSearchQuery(e.target.value)}
                className="w-full"
              />
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <RegionSelector className="bg-gray-800 text-white border-gray-700" />
            <WishlistIndicator onClick={() => dispatch(openWishlist())} />
            <CartIndicator onClick={() => dispatch(openCart())} />

            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <Input
                type="search"
                placeholder="Search products..."
                value={debouncedSearchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </form>

            {/* Mobile Navigation Links */}
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
