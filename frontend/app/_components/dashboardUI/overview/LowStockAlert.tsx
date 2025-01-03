import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Box, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { adminDashboardService } from '@/src/libs/services/adminServices/adminDashboardService';
import type { LowStockProduct, LowStockResponse } from '@/src/types';


const StockIndicator = ({ current, threshold }: { current: number; threshold: number }) => {
    // Calculate percentage of stock remaining
    const percentage = (current / threshold) * 100;

    let colorClass = '';
    if (percentage <= 25) {
        colorClass = 'bg-red-100 text-red-700';
    } else if (percentage <= 50) {
        colorClass = 'bg-yellow-100 text-yellow-700';
    } else {
        colorClass = 'bg-orange-100 text-orange-700';
    }


    return (
      <div className="flex items-center space-x-2">
        <div
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
        >
          {current} left
        </div>
        <span className="text-xs text-gray-500">of {threshold} minimum</span>
      </div>
    );
};


const ProductRow = ({ product }: { product: LowStockProduct }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };


    return (
      <div className="flex items-center space-x-4 p-4 hover:bg-gray-50">
        <div className="flex-shrink-0">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Box className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <Link
              href={`/admin/products/${product.id}`}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
            >
              {product.name}
            </Link>
            <div className="text-sm text-gray-500">
              {formatCurrency(product.price)}
            </div>
          </div>

          <div className="mt-1 flex items-center justify-between">
            <div className="text-sm text-gray-500">{product.category}</div>
            <StockIndicator
              current={product.stock}
              threshold={product.low_stock_threshold}
            />
          </div>
        </div>
      </div>
    );
};


export function LowStockAlerts() {
    const { data, isLoading, error } = useQuery<LowStockResponse>({
        queryKey: ['lowStockProducts'],
        queryFn: () => adminDashboardService.getLowStockProducts(5),
        refetchInterval: 60000, // Refetch every minute
    });

    if (isLoading) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </div>
      );
    }


    if (error || !data) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-red-500">
            Failed to load low stock products
          </div>
        </div>
      );
    }
    
    // Ensuring products array exists with a default empty array
  const products = data.products || [];
  const total = data.total || 0;


    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-medium text-gray-900">
                Low Stock Alerts
              </h2>
              {total > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  {total}
                </span>
              )}
            </div>
            <Link
              href="/admin/products?stock_status=low"
              className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1"
            >
              <span>View all</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))
          ) : (
            <div className="flex items-center justify-center p-6 text-gray-500">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>No products currently low in stock</span>
              </div>
            </div>
          )}
        </div>

        {total > 5 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              And {total - 5} more products with low stock
            </div>
          </div>
        )}
      </div>
    );
}