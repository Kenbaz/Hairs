"use client";

import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import { ProductForm } from "@/app/_components/dashboardUI/productSection/AdminProductForm";


export default function CreateProductPage() {
  return (
    <div className="space-y-6 md:mt-[2%] xl:-mt-[2%] xl:pt-[1%]">
      <div className="pl-3">
        <Breadcrumb />
      </div>
      <div className="px-4">
        <h1 className="text-2xl font-semibold text-gray-900">Create Product</h1>
      </div>
      <ProductForm />
    </div>
  );
}
