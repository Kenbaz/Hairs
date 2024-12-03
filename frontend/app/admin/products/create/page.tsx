"use client";

import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import { ProductForm } from "@/app/_components/dashboardUI/productSection/ProductForm";


export default function CreateProductPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="px-4">
        <h1 className="text-2xl font-semibold text-gray-900">Create Product</h1>
      </div>
      <ProductForm />
    </div>
  );
}
