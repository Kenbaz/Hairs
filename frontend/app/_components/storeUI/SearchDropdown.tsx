import React from "react";
import Link from "next/link";
import Image from "next/image";
import { InstantSearchResult } from "@/src/types";

interface SearchDropdownProps {
  results: InstantSearchResult[];
  onSelectItem?: () => void;
  setSearchQuery?: React.Dispatch<React.SetStateAction<string>>;
}

export function SearchDropdown({
  results,
  onSelectItem,
  setSearchQuery,
}: SearchDropdownProps) {
  if (results.length === 0) return null;

  // Separate exact matches and suggestions
  const exactMatches = results.filter((item) => item.type === "exact");
  const suggestions = results.filter((item) => item.type === "suggestion");

  return (
    <div className="absolute left-0 z-50 w-full mt-1 bg-white shadow-lg max-h-[350px] overflow-y-auto search-input pb-[5%]">
      {suggestions.length > 0 && (
        <div className="px-4 py-2 bg-gray-100 text-xs text-gray-600 uppercase">
          Suggestions
        </div>
      )}
      {suggestions.map((item) => (
        <div
          key={item.id}
          onClick={() => {
            // Set search query to the suggested complete name if setSearchQuery is provided
            if (setSearchQuery) {
              setSearchQuery(item.name);
            }
            // Call onSelectItem if provided
            if (onSelectItem) {
              onSelectItem();
            }
          }}
          className="p-3 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <p className="text-gray-700">{item.name}</p>
        </div>
      ))}

      {exactMatches.length > 0 && (
        <div className="px-4 py-2 text-gray-400 text-xs border-b uppercase">
          Products
        </div>
      )}
      {exactMatches.map((item) => (
        <Link
          key={item.id}
          href={`/shop/products/${item.slug}`}
          onClick={onSelectItem}
          className="flex items-center px-4 py-3 hover:bg-gray-100 transition-colors gap-4"
        >
          {item.primary_image?.url && (
            <div className="relative aspect-square h-[15%] w-[15%] flex-shrink-0 overflow-hidden">
              <Image
                src={item.primary_image.url}
                alt={item.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          )}
          <div>
            <p className="font-medium text-sm tracking-wide hover:underline text-gray-900">{item.name}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
