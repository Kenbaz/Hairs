import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSelector, useAppDispatch } from "../_redux/hooks";
import {
  selectFilters,
  selectCurrentPage,
  selectSearchQuery,
  setCurrentPage,
  setFilters,
  setSearchQuery,
  resetFilters,
} from "../_redux/productSlice";
import { productService } from "../services/customerServices/productService";
import { ProductFilters } from "@/src/types";
import { useCallback } from "react";
import { useDebounce } from "./useDebounce";

export const useProductsQuery = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);
  const currentPage = useAppSelector(selectCurrentPage);
  const searchQuery = useAppSelector(selectSearchQuery);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Products query
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ["products", {...filters, search: debouncedSearchQuery}],
    queryFn: () => productService.getProducts({...filters, search: debouncedSearchQuery}),
    staleTime: 60 * 60 * 1000, // Consider data fresh for 5 minutes
    placeholderData: keepPreviousData // Keep old data while fetching new data
  });


  // Categories query
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productService.getCategories(),
    staleTime: 60 * 60 * 1000, // Categories can be cached longer
  });


  // Featured products query
  const { data: featuredProducts, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => productService.getFeaturedProducts(),
    staleTime: 60 * 60 * 1000,
  });

  
  // Action handlers
  const updateFilters = useCallback(
    (newFilters: Partial<ProductFilters>) => {
      dispatch(setFilters(newFilters));
    },
    [dispatch]
  );

  const updatePage = useCallback(
    (page: number) => {
      dispatch(setCurrentPage(page));
    },
    [dispatch]
  );

  const updateSearchQuery = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch]
  );

  const clearFilters = useCallback(() => {
    dispatch(resetFilters());
  }, [dispatch]);

  // Prefetch next page
  const prefetchNextPage = useCallback(() => {
    if (
      productsData &&
      currentPage < Math.ceil(productsData.count / filters.page_size)
    ) {
      const nextPageFilters = { ...filters, page: currentPage + 1 };
      queryClient.prefetchQuery({
        queryKey: ["products", nextPageFilters],
        queryFn: () => productService.getProducts(nextPageFilters),
      });
    }
  }, [queryClient, currentPage, filters, productsData]);

  return {
    // Data
    products: productsData?.results || [],
    totalCount: productsData?.count || 0,
    categories: categories || [],
    featuredProducts: featuredProducts || [],

    // Loading states
    isLoading: isLoadingProducts || isLoadingCategories || isLoadingFeatured,
    error: productsError,

    // State
    filters,
    currentPage,
    debouncedSearchQuery,
    totalPages: productsData
      ? Math.ceil(productsData.count / filters.page_size)
      : 0,

    // Actions
    updateFilters,
    updatePage,
    updateSearchQuery,
    clearFilters,
    prefetchNextPage,
  };
};
