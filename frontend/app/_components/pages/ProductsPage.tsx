'use client';

import { useState } from "react";
import { useProductsQuery } from "@/src/libs/customHooks/useProducts";
import { ProductGrid } from "../storeUI/ProductsGridDisplay";
import { ProductFiltersSelect } from "../storeUI/ProductFilters";
import { Input } from "../UI/Input";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { Button } from "../UI/Button";


export default function ProductsPage() {
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const {
        products,
        isLoading,
        categories,
        filters,
        currentPage,
        totalPages,
        updateFilters,
        updatePage,
        updateSearchQuery,
        clearFilters,
        debouncedSearchQuery,
    } = useProductsQuery();

    const toggleMobileFilters = () => {
        setIsMobileFiltersOpen(!isMobileFiltersOpen);
    };


    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-500">
            Browse our collection of premium hair products
          </p>
        </div>

        {/* Mobile Filters Button */}
        <div className="lg:hidden mb-4">
          <Button
            onClick={toggleMobileFilters}
            variant="outline"
            className="w-full"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {isMobileFiltersOpen ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={(e) => e.preventDefault()} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search products..."
              value={debouncedSearchQuery}
              onChange={(e) => updateSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {debouncedSearchQuery && (
              <button
                onClick={() => updateSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
              </button>
            )}
          </form>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters - Desktop */}
          <div className="hidden lg:block">
            <ProductFiltersSelect
              filters={filters}
              onFilterChange={updateFilters}
              onClearFilters={clearFilters}
              categories={categories}
            />
          </div>

          {/* Filters - Mobile */}
          {isMobileFiltersOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-25 lg:hidden z-40">
              <div className="fixed inset-0 z-40 flex">
                <div className="relative flex-1 flex flex-col w-full max-w-xs bg-white">
                  <div className="px-4 py-4 border-b">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-900">
                        Filters
                      </h2>
                      <button
                        type="button"
                        className="-mr-2 w-10 h-10 flex items-center justify-center"
                        onClick={toggleMobileFilters}
                      >
                        <X className="h-6 w-6 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 overflow-y-auto">
                    <ProductFiltersSelect
                      filters={filters}
                      onFilterChange={updateFilters}
                      onClearFilters={clearFilters}
                      categories={categories}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="lg:col-span-3">
            <ProductGrid
              products={products}
              isLoading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={updatePage}
            />
          </div>
        </div>
      </div>
    );
}