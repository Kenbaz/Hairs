'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import { ProductForm } from '@/app/_components/dashboardUI/productSection/ProductForm';
import { adminProductService } from '@/src/libs/services/adminProductService';
import { use } from 'react';

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['products', id],
    queryFn: () => adminProductService.getProduct(Number(id)),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        Failed to load product
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="px-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Edit Product: {product?.name}
        </h1>
      </div>
      <ProductForm product={product} />
    </div>
  );
}