import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "./ProductCard";
import { Loader2 } from "lucide-react";
import { AdminProduct } from "@/src/types";
import { productService } from "@/src/libs/services/customerServices/productService";


interface RelatedProductsProps {
  currentProductId: number;
  categoryId: number;
}


export function RelatedProducts({ currentProductId, categoryId }: RelatedProductsProps) { 
    const { data: products, isLoading } = useQuery({
        queryKey: ['related-products', currentProductId, categoryId],
        queryFn: () => productService.getRelatedProducts(currentProductId, categoryId),
    });

    
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      );
    }

    if (!products?.length) {
      return null;
    }

    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Related Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: AdminProduct) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
}
