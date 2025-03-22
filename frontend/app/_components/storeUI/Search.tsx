"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "../UI/Input";
import { SearchDropdown } from "./SearchDropdown";
import { productService } from "@/src/libs/services/customerServices/productService";
import { InstantSearchResult } from "@/src/types";
import { useDebounce } from "@/src/libs/customHooks/useDebounce";

interface SearchProps {
  className?: string;
}

export function SearchInput({ className = "" }: SearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InstantSearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchQuery, 300);

  // Handle search results
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (debouncedSearchTerm.trim().length > 1) {
        try {
          const results = await productService.instantSearch(
            debouncedSearchTerm
          );
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };

    fetchSearchResults();
  }, [debouncedSearchTerm]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/shop/products?search=${encodeURIComponent(searchQuery.trim())}`
      );
      setIsSearchFocused(false);
    }
  };

  const handleSelectSearchItem = () => {
    console.log("Select search item triggered");
    setIsSearchFocused(false);
    setSearchQuery("");
  };

  return (
    <div ref={searchContainerRef} className={`w-full relative`}>
      <form
        onSubmit={handleSearch}
        className="w-full relative"
        // Prevent any global event handlers from interfering
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          className={`pl-10 pr-10 rounded-full sm:rounded-none bg-white text-gray-900 py-3 border focus:ring-gray-200 focus:ring-1 ${className}`}
        />
        <Search className="absolute text-gray-400 shadow-sm hover:text-gray-600 top-[23%] left-[7%] sm:left-[2%]" />
      </form>

      {isSearchFocused && searchResults.length > 0 && (
        <SearchDropdown
          results={searchResults}
          onSelectItem={handleSelectSearchItem}
        />
      )}
    </div>
  );
}
