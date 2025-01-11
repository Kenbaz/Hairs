'use client';

import { useState, useRef, useEffect } from "react";
import { Filter, Search, Mail } from "lucide-react";
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
    <div className="space-y-6">
      <div className="px-2">
        <Breadcrumb />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Customer Emails
        </h1>
        <Link href="/admin/support/emails/compose">
          <Button>
            <Mail className="h-4 w-4 mr-2" />
            Compose Email
          </Button>
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search emails..."
            className="pl-10"
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setFilterOpen(!filterOpen)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
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
  );
}
