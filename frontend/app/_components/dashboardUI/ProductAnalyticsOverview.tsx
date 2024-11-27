'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp, TrendingDown, Package, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { adminDashboardService } from '@/src/libs/services/adminDashboardService';
import { TopProduct, ProductAnalytics } from '@/src/types';


const ProductCard = ({ product }: { product: TopProduct }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const isPositiveGrowth = product.growth_rate >= 0;

    return (
      <div className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex-shrink-0">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-500" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <Link
              href={`/admin/products/${product.id}`}
              className="text-sm font-medium text-gray-900 hover:text-blue-600"
            >
              {product.name}
            </Link>
            <span
              className={`inline-flex items-center space-x-1 text-sm ${
                isPositiveGrowth ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositiveGrowth ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(product.growth_rate)}%</span>
            </span>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="text-sm text-gray-500">
              {formatCurrency(product.revenue)} • {product.total_sold} sold
            </div>
            <div className="text-sm text-gray-500">
              {product.stock} in stock
            </div>
          </div>
        </div>
      </div>
    );
};


const CategoryDistribution = ({ distribution, revenueByCategory }: {
    distribution: Record<string, number>;
    revenueByCategory: Record<string, number>;
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const totalProducts = Object.values(distribution).reduce((a, b) => a + b, 0);


    return (
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">
          Category Distribution
        </h3>
        <div className="space-y-3">
          {Object.entries(distribution).map(([category, count]) => {
            const percentage = (count / totalProducts) * 100;
            const revenue = revenueByCategory[category] || 0;

            return (
              <div key={category}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{category}</span>
                  <span className="text-gray-900">{count} products</span>
                </div>
                <div className="mt-1">
                  <div className="overflow-hidden bg-gray-200 h-2 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Revenue: {formatCurrency(revenue)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
};


export function ProductPerformance() {
    const { data, isLoading, error } = useQuery<ProductAnalytics>({
        queryKey: ['productAnalytics'],
        queryFn: () => adminDashboardService.getProductAnalytics(),
        refetchInterval: 300000,
    });


    if (isLoading) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </div>
      );
    }


    if (error || !data) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-red-500">
            Failed to load product performance data
          </div>
        </div>
      );
    }


    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Product Performance
            </h2>
            <Link
              href="/admin/products"
              className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1"
            >
              <span>View all products</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Top Performing Products
            </h3>
            <div className="space-y-2">
              {data.best_sellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>

          <CategoryDistribution
            distribution={data.category_distribution}
            revenueByCategory={data.revenue_by_category}
          />
        </div>
      </div>
    );
};