"use client";

import Link from "next/link";
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import { RegionSelector } from "./RegionSelector";

export function Footer() {

  return (
    <footer className="border-t h-[65%] shadow-sm bg-inherit text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium lg:text-lg text-gray-800 mb-4">
              Country/region
            </h3>
            <RegionSelector className="w-full mb-4" />
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <ul className="space-x-2 flex items-center justify-around">
              <li>
                <Link
                  href="/"
                  className="text-gray-700 text-[0.75rem] sm:text-[0.9rem] lg:text-base hover:text-gray-900 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-gray-700 text-[0.75rem] sm:text-[0.9rem] lg:text-base hover:text-gray-900 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-700 text-[0.75rem] lg:text-base hover:text-gray-900 transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
            <ul className="flex items-center justify-center space-x-4">
              <p className="text-[0.75rem] sm:text-[0.9rem] lg:text-base text-gray-800 underline">mizvivhairs@gmail.com</p>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Social Links */}
            <div className="flex space-x-6">
              <a href="#" className="p-2 shadow-sm ring-1 ring-gray-400">
                <FaFacebook className="h-6 w-6" />
              </a>
              <a href="#" className="p-2 shadow-sm ring-1 ring-gray-400">
                <FaInstagram className="h-6 w-6" />
              </a>
              <a href="#" className="p-2 shadow-sm ring-1 ring-gray-400">
                <FaTwitter className="h-6 w-6" />
              </a>
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Miz Viv Hairs. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
