"use client";

import { useCurrency } from "../_providers/CurrencyContext";
import { useEffect, useState } from "react";

interface ShippingFeeDisplayProps {
  amount: number;
  className?: string;
}

export function ShippingFeeDisplay({
  amount,
  className = "",
}: ShippingFeeDisplayProps) {
  const { selectedCurrency, availableCurrencies } = useCurrency();
  const [currencySymbol, setCurrencySymbol] = useState("");

  useEffect(() => {
    // Find the currency symbol for the selected currency
    const currency = availableCurrencies.find(
      (c) => c.code === selectedCurrency
    );
    setCurrencySymbol(currency?.symbol || "");
  }, [selectedCurrency, availableCurrencies]);

  // Format the number with proper separators but use the symbol directly
  const formattedAmount = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <span className={className}>
      {currencySymbol}
      {formattedAmount}
    </span>
  );
}
