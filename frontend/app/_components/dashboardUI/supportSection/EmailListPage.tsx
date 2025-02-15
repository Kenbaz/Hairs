'use client';

import { useState, useRef, useEffect } from "react";
import { Search, Mail, ChevronDown } from "lucide-react";
import { Input } from "@/app/_components/UI/Input";
import { Button } from "@/app/_components/UI/Button";
import { EmailFilterPanel } from "./EmailFilters";
import { EmailListTable } from "./EmailListTable";
import { EmailFilters } from "@/src/types";
import { Breadcrumb } from "../../UI/Breadcrumb";
import Link from "next/link";


export default function EmailListPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<EmailFilters>({
    page: 1,
    page_size: 10,
    search: "",
    status: undefined,
    priority: undefined,
    date_from: undefined,
    date_to: undefined,
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

    
  const handleSearch = (value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: value,
        page: 1, // Reset to first page on new search
      }));
    }, 300); // 300ms delay
  };

    
  const handleFilterChange = (newFilters: Partial<EmailFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page on filter change
    }));
  };

    
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

    
  return (
    <div className="space-y-6 h-screen px-2 md:px-0 md:mt-4 xl:-mt-4">
      <div className="px-2">
        <Breadcrumb />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl lg:landscape:text-xl font-semibold text-gray-900">
          Customer Emails
        </h1>
        <Link href="/admin/support/emails/compose">
          <Button
            className="bg-slate-700 hover:bg-slate-800 rounded-lg border border-slate-700 text-[0.8rem] md:text-base lg:landscape:text-[0.9rem]"
          >
            <Mail className="h-4 w-4 mr-2" />
            Compose Email
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg h-[92%]">
        {/* Search and Filter Bar */}
        <div className="flex items-center gap-3 py-2 mb-3 px-2 md:gap-4 md:px-4">
          <div className="relative flex-1 md:flex md:h-[2.7rem] xl:h-[3rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-500" />
            <Input
              placeholder="Search emails..."
              className="pl-10 w-full md:w-[70%] xl:w-[50%] md:h-full rounded-full text-gray-600 text-base"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center min-w-[100px]">
            <Button
              className="bg-gray-50 hover:bg-gray-100 w-full rounded-lg border"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <span className="text-gray-800 md:text-base lg:landscape:text-[0.9rem]">Filters</span>
              <ChevronDown
                className={`h-4 w-4 ml-2 text-gray-800 transition-transform duration-200 ${
                  filterOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {filterOpen && (
          <EmailFilterPanel filters={filters} onChange={handleFilterChange} />
        )}

        {/* Email List Table */}
        <EmailListTable
          filters={filters}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        />
      </div>
    </div>
  );
}
