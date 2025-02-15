"use client";

import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import ProductList from "@/app/_components/dashboardUI/productSection/AdminProductList";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/UI/Button";

export default function ProductPage() {
  const router = useRouter();

  const handleCreateProduct = () => {
    router.push("/admin/products/create");
  };

  return (
    <div className="space-y-6 md:space-y-8 min-h-full pt-[2%] px-2 md:px-0 md:mt-[1%] py-1 w-full xl:-mt-[2.5%]">
      <Breadcrumb />
      <div className="flex  items-center justify-between">
        <h1 className="text-2xl md:text-3xl lg:landscape:text-2xl pl-2 font-semibold text-gray-900">
          Products
        </h1>
        <Button
          onClick={handleCreateProduct}
          className="bg-slate-700 hidden md:flex hover:bg-slate-800 rounded-lg border border-slate-700 text-xm md:text-base"
        >
          Add Product
        </Button>
      </div>
      <ProductList />
    </div>
  );
}
