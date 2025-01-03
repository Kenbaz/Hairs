import { useQuery } from "@tanstack/react-query";
import { returnPolicyService } from "@/src/libs/services/customerServices/returnPolicyService";
import { ReturnPolicyDisplay } from "./ReturnPolicyDisplay";
import { Loader2 } from "lucide-react";


interface ProductReturnPolicyProps { 
    productId: number;
}

export function ProductReturnPolicy({ productId }: ProductReturnPolicyProps) { 
    const { data, isLoading, error } = useQuery({
        queryKey: ['return-policy', productId],
        queryFn: () => returnPolicyService.getProductPolicy(productId),
    });

    if (isLoading) {
      return (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red-600 text-sm">
          Failed to load return policy information
        </div>
      );
    }

    if (!data) return null;

    return <ReturnPolicyDisplay policy={data.effective_policy} />;
}