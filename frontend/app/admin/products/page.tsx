"use client";

import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import ProductList from "@/app/_components/dashboardUI/productSection/AdminProductList";


export default function ProductPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="px-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          All Products
        </h1>
      </div>
      <ProductList />
    </div>
  );
}
