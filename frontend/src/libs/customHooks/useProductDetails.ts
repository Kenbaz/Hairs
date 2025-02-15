import { useQuery } from "@tanstack/react-query";
import { productService } from "../services/customerServices/productService";


export const useProductDetailQuery = (slug?: string) => {
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productService.getProductBySlug(slug || ""),
    enabled: !!slug,
    staleTime: 60 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  return {
    product,
    isLoading,
    error,
    refetch,
  };
};
