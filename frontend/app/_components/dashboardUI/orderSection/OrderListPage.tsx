'use client';

import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, ChevronDown } from "lucide-react";
import { Button } from "@/app/_components/UI/Button";
import { Input } from "@/app/_components/UI/Input";
import { Alert } from "@/app/_components/UI/Alert";
import { adminOrderService } from "@/src/libs/services/adminServices/adminOrderService";
import { OrderFilters } from "@/src/types";
import OrderList from "./OrderList";
import FilterPanel from "./OrderFilters";
import { Breadcrumb } from "../../UI/Breadcrumb";


export default function OrdersPage() {
    const [filters, setFilters] = useState<OrderFilters>({
        page: 1,
        page_size: 10,
    });
    const [filterOpen, setFilterOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const searchTimeoutRef = useRef<NodeJS.Timeout>();


    const { data, isLoading, error } = useQuery({
        queryKey: ['orders', filters],
        queryFn: () => adminOrderService.getOrders(filters),
    });

    
    const handleSearch = (value: string) => {
        setSearchValue(value);

        // Clear existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        };

        // Set new timeout
        searchTimeoutRef.current = setTimeout(() => {
            setFilters((prev) => ({
              ...prev,
              search: value,
              page: 1,
            }));
        }, 300)
    };


    // Cleanup timeout on component unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);


    const handleFilterChange = (newFilters: Partial<OrderFilters>) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters,
            page: 1
        }));
    };


    if (error) {
        return <Alert type="error" message="Failed to load orders" />
    };


    return (
      <div className="space-y-6 px-2 md:pt-2 md:mt-[1%] lg:mt-[2%] xl:-mt-[2%] min-h-full">
        <div className=" ">
          <Breadcrumb />
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        </div>

        <div className="bg-white rounded-2xl min-h-screen w-full">
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
            <FilterPanel filters={filters} onChange={handleFilterChange} />
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
            </div>
          ) : (
            <OrderList
              orders={data?.results || []}
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
