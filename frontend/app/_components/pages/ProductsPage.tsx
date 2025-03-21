'use client';

import { useState } from "react";
import { useProductsQuery } from "@/src/libs/customHooks/useProducts";
import { ProductGrid } from "../storeUI/ProductsGridDisplay";
import { ProductFiltersSelect } from "../storeUI/ProductFilters";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
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
        clearFilters,
    } = useProductsQuery();

    const toggleMobileFilters = () => {
        setIsMobileFiltersOpen(!isMobileFiltersOpen);
    };


    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-12 lg:px-8 py-8 mt-[7.8rem] sm:mt-[4.4rem]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-wide text-gray-900">
            Products
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Browse our collection of premium luxury hairs
          </p>
        </div>

        {/* Mobile Filters Button */}
        <div className="lg:hidden mb-4">
          <Button
            onClick={toggleMobileFilters}
            variant="default"
            className="flex justify-start -ml-2"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {isMobileFiltersOpen ? "Hide Filters" : "Show Filters"}
          </Button>
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
          <AnimatePresence>
            {isMobileFiltersOpen && (
              <>
                {/* Backdrop overlay with fade animation */}
                <motion.div
                  className="fixed inset-0 bg-black bg-opacity-25 lg:hidden z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={toggleMobileFilters}
                />

                {/* Slide-in filters panel */}
                <motion.div
                  className="fixed inset-0 z-40 flex lg:hidden"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="relative flex-1 flex flex-col w-full max-w-xs bg-customWhite"
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  >
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
                          <X className="h-6 w-6 text-gray-600" />
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
                  </motion.div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Product Grid */}
          <div className=" lg:col-span-3">
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