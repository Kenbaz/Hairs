import { Metadata } from "next";
import ProductsPage from "@/app/_components/pages/ProductsPage";

export const metadata: Metadata = {
  title: "Products | Miz Viv Hairs",
  description:
    "Browse our collection of premium hair products, wigs, and extensions.",
};

export default function Products() {
  return <ProductsPage />;
}
