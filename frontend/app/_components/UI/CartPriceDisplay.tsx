"use client";

import { useCurrency } from "../_providers/CurrencyContext";
import { useEffect, useState } from "react";
import { currencyService } from "@/src/libs/services/customerServices/currencyService";

interface PriceDisplayProps {
  amount: number;
  sourceCurrency: string;
  additionalAmount?: number;
  additionalCurrency?: string;
  className?: string;
}

export function CartPriceDisplay({
  amount,
  sourceCurrency,
  additionalAmount = 0,
  additionalCurrency,
  className = "",
}: PriceDisplayProps) {
  const { selectedCurrency, availableCurrencies } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState<number>(amount);
  const [convertedAdditionalAmount, setConvertedAdditionalAmount] =
    useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("");

  useEffect(() => {
    // Find the currency symbol for the selected currency
    const currency = availableCurrencies.find(
      (c) => c.code === selectedCurrency
    );
    setCurrencySymbol(currency?.symbol || "");
  }, [selectedCurrency, availableCurrencies]);

  useEffect(() => {
    const convertPrice = async () => {
      setIsLoading(true);
      try {
        // Convert main amount if needed
        if (sourceCurrency !== selectedCurrency) {
          const result = await currencyService.convertPrice(
            amount,
            sourceCurrency,
            selectedCurrency
          );
          setConvertedAmount(result.amount);
        } else {
          setConvertedAmount(amount);
        }

        // Convert additional amount only if it needs conversion
        if (
          additionalAmount &&
          additionalCurrency &&
          additionalCurrency !== selectedCurrency
        ) {
          const result = await currencyService.convertPrice(
            additionalAmount,
            additionalCurrency,
            selectedCurrency
          );
          setConvertedAdditionalAmount(result.amount);
        } else {
          setConvertedAdditionalAmount(additionalAmount || 0);
        }
      } catch (error) {
        console.error("Error converting price:", error);
        // Fallback to unconverted amount
        setConvertedAmount(amount);
        setConvertedAdditionalAmount(additionalAmount || 0);
      } finally {
        setIsLoading(false);
      }
    };

    convertPrice();
  }, [
    amount,
    sourceCurrency,
    selectedCurrency,
    additionalAmount,
    additionalCurrency,
  ]);

  if (isLoading) {
    return <span className={className}>...</span>;
  }

  // Calculate total for display
  const total = additionalAmount
    ? convertedAmount + convertedAdditionalAmount
    : convertedAmount;

  // Format the number with proper separators but use the symbol directly
  const formattedAmount = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(total);

  return (
    <span className={className}>
      {currencySymbol}
      {formattedAmount}
    </span>
  );
}
