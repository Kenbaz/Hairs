"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Filter, Search } from "lucide-react";
import { Button } from "@/app/_components/UI/Button";
import { Input } from "@/app/_components/UI/Input";
import { Alert } from "@/app/_components/UI/Alert";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import { ReturnFiltersType } from "@/src/types";
import ReturnsList from "./ReturnList";
import ReturnFilters from "./ReturnFilters";
import { adminReturnService } from "@/src/libs/services/adminServices/adminReturnServices";


export default function ReturnsPage() {
  const [filters, setFilters] = useState<ReturnFiltersType>({
    page: 1,
    page_size: 10,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["returns", filters],
    queryFn: () => adminReturnService.getReturns(filters),
  });

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setFilters((prev) => ({
      ...prev,
      search: value,
      page: 1,
    }));
  };

  const handleFilterChange = (newFilters: Partial<ReturnFiltersType>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  if (error) {
    return <Alert type="error" message="Failed to load returns" />;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Return Requests
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search returns..."
            className="pl-10"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setFilterOpen(!filterOpen)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {filterOpen && (
        <ReturnFilters filters={filters} onChange={handleFilterChange} />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <ReturnsList
          returns={data?.results || []}
          totalCount={data?.count || 0}
          currentPage={filters.page || 1}
          pageSize={filters.page_size || 10}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        />
      )}
    </div>
  );
}
