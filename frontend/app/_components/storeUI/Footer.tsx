"use client";

import Link from "next/link";
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import { RegionSelector } from "./RegionSelector";

export function Footer() {

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Currency and Contact */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Select Region
            </h3>
            <RegionSelector className="w-full mb-4 bg-gray-800 text-white border-gray-700" />

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">
              Contact Us
            </h3>
            <p className="text-sm text-gray-400">
              Email: mizvivhairs@gmail.com
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Social Links */}
            <div className="flex space-x-6">
              <a href="#" className="hover:text-white">
                <FaFacebook className="h-6 w-6" />
              </a>
              <a href="#" className="hover:text-white">
                <FaInstagram className="h-6 w-6" />
              </a>
              <a href="#" className="hover:text-white">
                <FaTwitter className="h-6 w-6" />
              </a>
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Miz Viv Hairs. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
