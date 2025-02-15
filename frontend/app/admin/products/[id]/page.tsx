"use client";

import ProductDetailsPage from "@/app/_components/dashboardUI/productSection/AdminProductDetails";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";


export default function ProductPage() {
  return (
    <div className="space-y-6 md:space-y-[2%] md:mt-[1%] md:pt-[2%] lg:mt-[2%] xl:-mt-[2.5%]">
      <div className="px-4 py-1">
          <Breadcrumb />
        </div>
      <div className="px-4">
        <h1 className="text-2xl font-semibold text-gray-900">Product Details</h1>
      </div>
      <ProductDetailsPage />
    </div>
  );
}
