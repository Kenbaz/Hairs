'use client';

import { ProductCard } from "./ProductCard";
import { StoreProduct } from "@/src/types";
import { Loader2 } from "lucide-react";
import { Pagination } from "../UI/Pagination";
import FadeInSection from "../UI/FadeInSection";


interface ProductGridProps {
    products: StoreProduct[];
    isLoading: boolean;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}


export function ProductGrid({
    products,
    isLoading,
    currentPage,
    totalPages,
    onPageChange,
    className = "",
}: ProductGridProps) { 
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 text-gray-600" />
            </div>
        );
    };


    if (products.length === 0) {
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters to find what you&apos;re looking
              for.
            </p>
          </div>
        );
    };


    return (
      <div className={className}>
        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 gap-y-5">
          {products.map((product) => (
            <FadeInSection
              key={product.id}
              className="w-full"
            >
              <ProductCard product={product} />
            </FadeInSection>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>
    );
}