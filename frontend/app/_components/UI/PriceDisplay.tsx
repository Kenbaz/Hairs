import { useCurrency } from "../_providers/CurrencyContext";
import { useQuery } from "@tanstack/react-query";
import { adminCurrencyService } from "@/src/libs/services/adminServices/adminCurrencyService";
import { Loader2 } from "lucide-react";


interface PriceDisplayProps { 
    amount: number;
    sourceCurrency: string;
    className?: string;
    showLoader?: boolean;
}


export function PriceDisplay({
    amount,
    sourceCurrency,
    className = '',
    showLoader = true
}: PriceDisplayProps) {
    const { selectedCurrency, availableCurrencies } = useCurrency();

    // Only query if currencies are different
    const { data: convertedPrice, isLoading } = useQuery({
      queryKey: ["price-conversion", amount, sourceCurrency, selectedCurrency],
      queryFn: () =>
        adminCurrencyService.convertPrice(
          amount,
          sourceCurrency,
          selectedCurrency
        ),
      // Only convert if currencies are different or the amount is valid
      enabled:
        sourceCurrency !== selectedCurrency && amount != null && amount > 0,
      // Cache result for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Don't refetch on window focus
      refetchOnWindowFocus: false,
    });

    if (amount == null) {
      return <span className={className}>-</span>;
    }

    if (isLoading && showLoader) {
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    // If no conversion is needed or conversion failed, format original amount
    if (sourceCurrency === selectedCurrency || !convertedPrice) {
        const currency = availableCurrencies.find(c => c.code === sourceCurrency);
        return (
            <span className={className}>
                {currency?.symbol}
                {amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}
            </span>
        );
    }


    return (
        <span className={className}>
            {convertedPrice.formatted}
        </span>
    );
}