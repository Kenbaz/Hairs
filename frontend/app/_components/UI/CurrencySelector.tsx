import { useCurrency } from "../_providers/CurrencyContext";
import { Loader2 } from "lucide-react";
import { useAppSelector } from "@/src/libs/_redux/hooks";
import { selectIsAuthenticated } from "@/src/libs/_redux/authSlice";


interface CurrencySelectorProps { 
    className?: string;
}


export function CurrencySelector({ className = '' }: CurrencySelectorProps) {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);

    const {
        selectedCurrency,
        updateCurrency,
        availableCurrencies,
        isLoading,
        error,
    } = useCurrency();


    // Don't show anything if not authenticated
    if (!isAuthenticated) {
        return null;
    }


    if (isLoading) {
        return (
          <div className="flex items-center space-x-2 px-3 py-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading currencies...</span>
          </div>
        );
    };


    if (error || !availableCurrencies.length) {
        return null;
    };


    return (
      <div className="relative">
        <select
          value={selectedCurrency}
          onChange={(e) => updateCurrency(e.target.value)}
          className={`
                    block w-full rounded-lg border border-gray-300 
                    bg-white px-3 py-2 pr-10 
                    focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                    sm:text-sm
                    ${className}
                `}
        >
          {availableCurrencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code === selectedCurrency ? (
                <>
                  {currency.symbol} {currency.code} (Selected)
                </>
              ) : (
                <>
                  {currency.symbol} {currency.code}
                </>
              )}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
          {selectedCurrency !== "USD" && (
            <span className="text-xs text-gray-500">
              1 USD ={" "}
              {
                availableCurrencies.find((c) => c.code === selectedCurrency)
                  ?.exchange_rate
              }{" "}
              {selectedCurrency}
            </span>
          )}
        </div>
      </div>
    );
}