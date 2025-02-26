
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/app/_components/_providers/CurrencyContext";
import { shippingService } from "@/src/libs/services/customerServices/shippingService";
import { CartResponse } from "@/src/types";

export function useShippingFee(cart: CartResponse | null | undefined) {
  const { selectedCurrency } = useCurrency();

  // Calculate subtotal from cart
  const subtotal =
    cart?.items.reduce(
      (sum, item) => sum + item.price_at_add * item.quantity,
      0
    ) || 0;

  // Round subtotal to 2 decimal places for consistent query keys
  const roundedSubtotal = Math.round(subtotal * 100) / 100;

  // Use React Query to fetch and cache the shipping fee
  const { data, isLoading, error } = useQuery({
    queryKey: ["shipping-fee", selectedCurrency, roundedSubtotal],
    queryFn: () =>
      shippingService.calculateShippingFee(selectedCurrency, roundedSubtotal),
    enabled: !!cart?.items.length && !!selectedCurrency && roundedSubtotal > 0,
    staleTime: 60 * 60 * 1000, // 1 hour
    placeholderData: keepPreviousData,
  });
    
  if (error) {
    console.error("Error calculating shipping:", error);
  }

  // Return the shipping fee or 0 if not available
  return {
    shippingFee: data?.shipping_fee || 0,
    isCalculating: isLoading,
  };
}
