"use client";

import { Fragment } from "react";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { User, LogOut, Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useAppDispatch } from "@/src/libs/_redux/hooks";
import { logout } from "@/src/libs/_redux/authSlice";
import { useAuth } from "@/src/libs/customHooks/useAuth";
import Image from "next/image";

export function UserMenu() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const menuItems = [
    {
      label: "My Profile",
      href: "/shop/dashboard/profile",
      icon: User,
    },
    {
      label: "My Orders",
      href: "/shop/dashboard/orders",
      icon: ShoppingBag,
    },
    {
      label: "My Wishlist",
      href: "/shop/dashboard/wishlist",
      icon: Heart,
    },
  ];

  return (
    <Menu as="div" className="relative z-20">
      <MenuButton className="flex items-center text-gray-700 hover:text-gray-900">
        <span className="sr-only">Open user menu</span>
        {user?.avatar ? (
          <Image
            src={user.avatar}
            alt="Profile"
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-500" />
          </div>
        )}
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-lg shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
          {/* User Info */}
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-medium text-gray-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item) => (
              <MenuItem key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Link>
              </MenuItem>
            ))}

            {/* Logout Button */}
            <MenuItem>
              <button
                onClick={() => dispatch(logout())}
                className="flex items-center px-4 w-full py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </button>
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
