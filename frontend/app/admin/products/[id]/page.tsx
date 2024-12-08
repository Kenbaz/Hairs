// products/[id]

"use client";


import ProductDetailsPage from "@/app/_components/dashboardUI/productSection/AdminProductDetails";

export default function ProductPage() {
  return (
    <div className="space-y-6">
      <div className="px-4">
        <h1 className="text-2xl font-semibold text-gray-900">Product Details</h1>
      </div>
      <ProductDetailsPage />
    </div>
  );
}
