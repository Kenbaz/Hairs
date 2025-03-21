"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className={`flex items-center justify-center space-x-2 ${className}`}>
      <Button
        variant="default"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {getPageNumbers().map((pageNumber, index) => (
        <div key={index}>
          {pageNumber === "..." ? (
            <span className="px-2">
              <MoreHorizontal className="h-4 w-4 text-gray-600" />
            </span>
          ) : (
            <Button
              variant="default"
              className={`text-sm ${currentPage === pageNumber ? "border-b border-black font-medium w-5" : ""}`}
              onClick={() =>
                typeof pageNumber === "number" && onPageChange(pageNumber)
              }
            >
              {pageNumber}
            </Button>
          )}
        </div>
      ))}

      <Button
        variant="default"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </nav>
  );
}
