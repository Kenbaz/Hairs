'use client';

import React, { useRef, useState } from "react";
import { Plus, Filter, Download, Search, Loader2 } from "lucide-react";
import { Button } from "@/app/_components/UI/Button";
import { Input } from "@/app/_components/UI/Input";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import ProductRow from "./ProductRows";
import { adminProductService } from "@/src/libs/services/adminProductService";
import type { AdminProduct, ProductFilters, ProductResponse, StockStatus } from "@/src/types";
// import { toast } from "react-hot-toast";
import { Alert } from "../../UI/Alert";
import { ConfirmModal } from "../../UI/ConfirmModal";
import { useRouter } from "next/navigation";


const ProductList = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    page_size: 10,
    search: '',
    category: '',
  });
  const [searchValue, setSearchValue] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);
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
    queryFn: () => adminProductService.getProducts(filters),
    placeholderData: (previousData) => previousData,
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


  const handleCreateProduct = () => {
    router.push('/admin/products/create');
  }


  const handleEdit = (product: AdminProduct) => {
    router.push(`/admin/products/${product.id}/edit`);
  };


  const showAlert = (type: 'success' | 'error', message: string) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 5000);
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


  const handleFilterChange = <K extends keyof ProductFilters>(
    filterKey: K,
    value: ProductFilters[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
      page: 1,
    }));
  };

    
    return (
      <div className="space-y-6">
        {alert && (
          <Alert type={alert.type} message={alert.message} className="mb-4" />
        )}
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <div className="flex items-center space-x-4">
            <Button onClick={handleCreateProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={searchValue}
              onChange={handleSearch}
            />
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {Object.values(filters).some(
                (value) => value !== undefined && value !== ""
              ) && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-600 rounded-full px-2">
                  Active
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Filter Panel - Show when filterOpen is true */}
        {filterOpen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="w-full rounded-lg border-gray-300 shadow-sm"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="straight">Straight Hairs</option>
                <option value="curly">Curly Hairs</option>
                <option value="wavy">Wavy Hairs</option>
                <option value="bouncy">Bouncy Hairs</option>
                <option value="braiding">Braiding Extensions</option>
                <option value="care">Hair Care Products</option>
                <option value="tools">Styling Tools</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Status
              </label>
              <select
                className="w-full rounded-lg border-gray-300 shadow-sm"
                value={filters.stock_status || ""}
                onChange={(e) => {
                  const value = e.target.value as StockStatus | "";
                  handleFilterChange("stock_status", value ? value : undefined);
                }}
              >
                <option value="">All</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.min_price || ""}
                  onChange={(e) =>
                    handleFilterChange("min_price", e.target.valueAsNumber)
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.max_price || ""}
                  onChange={(e) =>
                    handleFilterChange("min_price", e.target.valueAsNumber)
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="bg-white rounded-lg min-h-screen shadow overflow-y-auto border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border border-black">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Product
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Stock
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
                  <ProductRow
                    key={product.id}
                    product={product}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleFeatured={handleToggleFeatured}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
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