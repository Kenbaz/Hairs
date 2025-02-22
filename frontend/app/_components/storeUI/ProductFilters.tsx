'use client';

import { useState } from "react";
import { Input } from "../UI/Input";
import { Button } from "../UI/Button";
import { X } from "lucide-react";
import { StoreProductFilters } from "@/src/types";


interface ProductFiltersProps {
    filters: StoreProductFilters;
    onFilterChange: (newFilters: Partial<StoreProductFilters>) => void;
    onClearFilters: () => void;
    categories: Array<{ id: number; name: string; slug: string }>;
    className?: string;
}


export function ProductFiltersSelect({
    filters,
    onFilterChange,
    onClearFilters,
    categories,
    className = "",
}: ProductFiltersProps) { 
    const [priceRange, setPriceRange] = useState({
        min: filters.min_price?.toString() || "",
        max: filters.max_price?.toString() || "",
    });


    const hairTypes: Array<{ value: 'raw' | 'virgin' | 'single donor'; label: string }> = [
      { value: "raw", label: "Raw Hair" },
      { value: "virgin", label: "Virgin Hair" },
      { value: "single donor", label: "Single Donor Hair" },
    ];


    const handlePriceChange = (type: 'min' | 'max', value: string) => {
        const numValue = value === '' ? undefined : Number(value);
        setPriceRange(prev => ({ ...prev, [type]: value }));
        
        if (value === '' || !isNaN(numValue as number)) {
            onFilterChange({
              [`${type}_price`]: numValue,
              page: 1,
            });
        }
    };


    const handleCategoryChange = (categorySlug: string) => {
      onFilterChange({
        category__slug:
          categorySlug === filters.category__slug ? undefined : categorySlug,
        page: 1, 
      });
    };


    const handleHairTypeChange = (type: "raw" | "virgin" | "single donor") => {
      onFilterChange({
        hair_type: type === filters.hair_type ? undefined : type,
      });
    };


    return (
      <div className={`space-y-6 ${className}`}>
        {/* Clear Filters Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center space-x-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={filters.category__slug === category.slug}
                  onChange={() => handleCategoryChange(category.slug)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Hair Types */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Hair Type</h3>
          <div className="space-y-2">
            {hairTypes.map((type) => (
              <label
                key={type.value}
                className="flex items-center space-x-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={filters.hair_type === type.value}
                  onChange={() => handleHairTypeChange(type.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Price Range
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => handlePriceChange("min", e.target.value)}
              min={0}
            />
            <Input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => handlePriceChange("max", e.target.value)}
              min={0}
            />
          </div>
        </div>

        {/* Stock Status */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Availability
          </h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filters.stock_status === "in_stock"}
                onChange={() =>
                  onFilterChange({
                    stock_status:
                      filters.stock_status === "in_stock"
                        ? undefined
                        : "in_stock",
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>In Stock</span>
            </label>
          </div>
        </div>
      </div>
    );
};