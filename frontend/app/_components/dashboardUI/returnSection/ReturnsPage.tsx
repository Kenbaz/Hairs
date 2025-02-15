"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, ChevronDown } from "lucide-react";
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
    <div className="space-y-6 px-2 h-screen md:mt-[2%] xl:-mt-[2%] 2xl:-mt-[1%]">
      <Breadcrumb />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Return Requests
        </h1>
      </div>

      <div className="bg-white rounded-xl pt-1 shadow h-full">
        <div className="flex items-center gap-3 py-2 mb-3 px-2 md:gap-4 md:px-4">
          <div className="relative flex-1 md:flex md:h-[2.7rem] xl:h-[3rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-500" />
            <Input
              placeholder="Search Orders..."
              className="pl-10 w-full md:w-[70%] xl:w-[50%] md:h-full rounded-full text-gray-600 text-base"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center min-w-[100px]">
            <Button
              className="bg-gray-50 hover:bg-gray-100 w-full rounded-lg border"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <span className="text-gray-800 md:text-base">Filters</span>
              <ChevronDown
                className={`h-4 w-4 ml-2 text-gray-800 transition-transform duration-200 ${
                  filterOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>
        </div>

        {filterOpen && (
          <ReturnFilters filters={filters} onChange={handleFilterChange} />
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
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
    </div>
  );
}
