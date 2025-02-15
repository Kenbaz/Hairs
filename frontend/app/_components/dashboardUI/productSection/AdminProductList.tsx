'use client';

import React, { useEffect, useRef, useState } from "react";
import { Search, Loader2, ChevronDown, Check } from "lucide-react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Button } from "@/app/_components/UI/Button";
import { Input } from "@/app/_components/UI/Input";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import ProductRow from "./AdminProductRows";
import { adminProductService } from "@/src/libs/services/adminServices/adminProductService";
import type { AdminProduct, ProductFilters, ProductResponse, StockStatus } from "@/src/types";
// import { toast } from "react-hot-toast";
import { Alert } from "../../UI/Alert";
import { ConfirmModal } from "../../UI/ConfirmModal";
import { useRouter } from "next/navigation";
import { ProductBulkActions } from "./ProductBulkAction";

const CATEGORY_OPTIONS = [
  { value: "straight", label: "Straight Hairs" },
  { value: "curly", label: "Curly Hairs" },
  { value: "wavy", label: "Wavy Hairs" },
  { value: "bouncy", label: "Bouncy Hairs" },
  { value: "braiding", label: "Braiding Extensions" },
  { value: "care", label: "Hair Care Products" },
  { value: "tools", label: "Styling Tools" },
] as const;

const ProductList = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    page_size: 7,
    search: '',
    category: '',
  });
  const [searchValue, setSearchValue] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
  
  const router = useRouter();


  const QUERY_KEYS = {
  products: {
    all: ['products'],
    list: (filters: ProductFilters) => [...QUERY_KEYS.products.all, { filters }],
  }
} as const;


  const queryClient = useQueryClient();


  // Fetch products
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.products.list(filters),
    queryFn: () => {
      console.log("Sending filters to backend:", filters);
      return adminProductService.getProducts(filters)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });


  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (productId: number) => adminProductService.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.all });
      showAlert('success', 'Product deleted successfully');
    },
    onError: (error) => {
      showAlert('error', 'Failed to delete product');
      console.error('Delete error:', error);
    }
  });


  const toggleFeaturedMutation = useMutation({
    mutationFn: (productId: number) =>
      adminProductService.toggleFeatured(productId),
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(
        QUERY_KEYS.products.list(filters),
        (oldData: ProductResponse | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            results: oldData.results.map((product) =>
              product.id === updatedProduct.id ? updatedProduct : product
            ),
          };
        }
      );
      showAlert('success', `${updatedProduct.is_featured ? 'Product marked as featured' : 'Product removed from featured'}`);
    },
    onError: (error) => {
      showAlert('error', 'Failed to update featured status');
      console.error("Toggle featured error:", error);
    },
  });


  const handleSelectAll = (checked: boolean) => { 
    if (checked && data) {
      setSelectedIds(data.results.map((product) => product.id));
    } else {
      setSelectedIds([]);
    }
  }


  const handleSelectOne = (productId: number) => {
    setSelectedIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };


  const isAllSelected = Boolean(
    data?.results &&
      data.results.length > 0 &&
      data.results.length === selectedIds.length
  );


  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds([]);
  }, [filters]);


  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };


  const handleCreateProduct = () => {
    router.push('/admin/products/create');
  }


  const handleEdit = (product: AdminProduct) => {
    router.push(`/admin/products/${product.id}/edit`);
  };


  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteMutation.mutateAsync(productToDelete.id);
      setProductToDelete(null);
    } catch {
      //
    }
  }


  const handleDelete = async (product: AdminProduct) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };


  const handleToggleFeatured = async (product: AdminProduct) => {
    try {
      await toggleFeaturedMutation.mutateAsync(product.id);
    } catch {
      //
    }
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout>()


  // Handle search with debounce
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: value,
        page: 1,
      }));
    }, 300); // 300ms debounce
  };


  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);


  const handleFilterChange = <K extends keyof ProductFilters>(
    filterKey: K,
    value: ProductFilters[K]
  ) => {
    // Clear empty values to avoid redundant URL parameters
    const newValue = value === '' ? undefined : value;

    setFilters((prev) => ({
      ...prev,
      [filterKey]: newValue,
      page: 1,
    }));
  };

    
    return (
      <div className="space-y-6 rounded-2xl w-full bg-customWhite3 pt-[3%] md:pt-[0.1rem] xl:pt-[0.1rem] pb-[15%] md:pb-0 min-h-screen">
        {alert && (
          <Alert type={alert.type} message={alert.message} className="mb-4" />
        )}
        {/* Header Section */}
        <div className="ml-[62%] md:hidden md:ml-[80%] xl:ml-[85%] 2xl:ml-[89%]">
          <Button
            onClick={handleCreateProduct}
            className="bg-slate-700 hover:bg-slate-800 rounded-lg border border-slate-700 text-sm md:text-base"
          >
            Add Product
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3 px-2 md:gap-4 md:px-4">
          <div className="relative flex-1 md:flex md:h-[2.7rem] xl:h-[3rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-500" />
            <Input
              placeholder="Search products..."
              className="pl-10 w-full md:w-[70%] xl:w-[50%] md:h-full rounded-full text-gray-600 text-base"
              value={searchValue}
              onChange={handleSearch}
            />
          </div>
          <div className="flex items-center min-w-[100px]">
            <Button
              className="bg-gray-50 hover:bg-gray-100 w-full rounded-lg border"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <span className="text-gray-800 md:text-base">Filters</span>
              <ChevronDown
                className={`h-4 w-4 ml-2 text-gray-800 transition-transform duration-200 ${
                  filterOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>
        </div>

        {/* Filter Panel - Show when filterOpen is true */}
        {filterOpen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white ">
            {/* Category Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Category
              </label>
              <Listbox
                value={filters.category || ""}
                onChange={(value) => handleFilterChange("category", value)}
              >
                <div className="relative mt-1">
                  <ListboxButton className="relative w-full cursor-pointer rounded-lg border bg-gray-50 py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-1 focus:ring-slate-500 text-gray-500 sm:text-sm md:text-base">
                    <span className="block truncate">
                      {CATEGORY_OPTIONS.find(
                        (cat) => cat.value === filters.category
                      )?.label || "All Categories"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDown
                        className="h-4 w-4 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </ListboxButton>
                  <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 md:text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    <ListboxOption
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                          active ? "bg-gray-200 text-blue-900" : "text-gray-900"
                        }`
                      }
                      value=""
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            All Categories
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </ListboxOption>
                    {CATEGORY_OPTIONS.map((category) => (
                      <ListboxOption
                        key={category.value}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-blue-100 text-blue-900"
                              : "text-gray-900"
                          }`
                        }
                        value={category.value}
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? "font-medium" : "font-normal"
                              }`}
                            >
                              {category.label}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                <Check className="h-4 w-4" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>

            {/* Stock Status Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Stock Status
              </label>
              <Listbox
                value={filters.stock_status || ""}
                onChange={(value) =>
                  handleFilterChange("stock_status", value as StockStatus)
                }
              >
                <div className="relative mt-1">
                  <ListboxButton className="relative w-full cursor-pointer rounded-lg border bg-gray-50 py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-1 focus:ring-slate-500 text-gray-400 sm:text-sm md:text-base">
                    <span className="block truncate">
                      {filters.stock_status
                        ? filters.stock_status
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())
                        : "All"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDown
                        className="h-4 w-4 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </ListboxButton>
                  <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 md:text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    <ListboxOption
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                          active ? "bg-gray-200 text-blue-900" : "text-gray-900"
                        }`
                      }
                      value=""
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            All
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </ListboxOption>
                    {["in_stock", "low_stock", "out_of_stock"].map((status) => (
                      <ListboxOption
                        key={status}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-blue-100 text-blue-900"
                              : "text-gray-900"
                          }`
                        }
                        value={status}
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? "font-medium" : "font-normal"
                              }`}
                            >
                              {status
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                <Check className="h-4 w-4" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>

            {/* Price Range - Keep the existing Input components */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Price Range
              </label>
              <div className="flex gap-2 w-full">
                <Input
                  type="number"
                  placeholder="Min"
                  className="rounded-lg w-[100%] md:text-base"
                  value={filters.min_price || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "min_price",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  className="rounded-lg w-[100%] md:text-base"
                  value={filters.max_price || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "max_price",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="bg-white min-h-full border-b overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 w-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={isAllSelected || false}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={!data?.results?.length}
                  />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 md:text-base xl:text-[0.9rem] uppercase"
                >
                  Product
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase md:text-base xl:text-[0.9rem]"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase md:text-base xl:text-[0.9rem]"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase md:text-base xl:text-[0.9rem]"
                >
                  Stock
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase md:text-base xl:text-[0.9rem]"
                >
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Product rows will be rendered here */}
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-red-500"
                  >
                    Failed to load products
                  </td>
                </tr>
              ) : data?.results.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                data?.results.map((product) => (
                  <tr
                    key={product.id}
                    className={
                      selectedIds.includes(product.id) ? "bg-blue-50" : ""
                    }
                  >
                    <td className="p-4 w-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedIds.includes(product.id) || false}
                        onChange={() => handleSelectOne(product.id)}
                      />
                    </td>
                    <ProductRow
                      product={product}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleFeatured={handleToggleFeatured}
                    />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {data && (
          <div className="flex items-center justify-between px-4 py-4 bg-white border-t-0 rounded-2xl">
            <div className="md:text-[0.95rem] text-sm text-gray-500">
              Showing{" "}
              {Math.min((filters.page || 1) * filters.page_size, data.count)} of{" "}
              {data.count} products
            </div>

            <nav className="flex items-center gap-2">
              <Button
                className="rounded-lg bg-slate-700 border border-slate-700 hover:bg-slate-800 text-sm py-2 px-1 md:text-base"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: (prev.page || 1) - 1,
                  }))
                }
                disabled={!data?.previous || isLoading}
              >
                Previous
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.ceil(data.count / filters.page_size) },
                  (_, i) => i + 1
                ).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        page: pageNum,
                      }))
                    }
                    className={`px-3 py-1 text-sm rounded-full ${
                      pageNum === filters.page
                        ? "bg-gray-100 text-gray-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <Button
                className="rounded-lg bg-slate-700 border border-slate-700 hover:bg-slate-800 py-1 px-1 text-sm md:text-base"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: (prev.page || 1) + 1,
                  }))
                }
                disabled={!data.next || isLoading}
              >
                Next
              </Button>
            </nav>
          </div>
        )}
        <ProductBulkActions
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          queryKey={QUERY_KEYS.products.list(filters)}
        />
        {deleteModalOpen && (
          <ConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setProductToDelete(null);
            }}
            onConfirm={confirmDelete}
            title="Delete Product"
            message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
            confirmText="Delete Product"
            cancelText="Cancel"
            variant="danger"
          />
        )}
      </div>
    );
};


export default ProductList;