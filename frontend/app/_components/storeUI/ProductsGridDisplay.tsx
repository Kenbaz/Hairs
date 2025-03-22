'use client';

import { ProductCard } from "./ProductCard";
import { StoreProduct } from "@/src/types";
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


const ProductSkeleton = () => (
  <div className="animate-pulse bg-white shadow-sm overflow-hidden">
    {/* Image skeleton */}
    <div className="aspect-square w-full bg-gray-200" />

    {/* Product info skeleton */}
    <div className="py-4 px-2">
      {/* Title */}
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />

      {/* Price */}
      <div className="mt-2 space-y-1">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  </div>
);


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
          <div className={className}>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 gap-y-5">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
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