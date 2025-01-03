'use client';

import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Filter, Search } from "lucide-react";
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
      <div className="space-y-6">
        <Breadcrumb />

        <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
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
          <FilterPanel filters={filters} onChange={handleFilterChange} />
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
    );
}
