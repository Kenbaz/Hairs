'use client';

import { createContext, useCallback, useContext, useState, useEffect, PropsWithChildren } from "react";
import type { Currency } from "@/src/types";
import { useQuery } from "@tanstack/react-query";
import { adminCurrencyService } from "@/src/libs/services/adminServices/adminCurrencyService";
import { currencyService } from "@/src/libs/services/customerServices/currencyService";
import { useAuth } from "@/src/libs/customHooks/useAuth";


interface CurrencyContextType {
    selectedCurrency: string;
    updateCurrency: (currency: string) => void;
    availableCurrencies: Currency[];
    isLoading: boolean;
    error: Error | null;
}


const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedCurrency';
const DEFAULT_CURRENCY = 'USD';


export function CurrencyProvider({ children }: PropsWithChildren) {
    // Get authentication status
    const { isAdmin } = useAuth();

    // Initialize from local storage with USD fallback
    const [selectedCurrency, setSelectedCurrency] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(STORAGE_KEY) || DEFAULT_CURRENCY;
        }
        return DEFAULT_CURRENCY;
    });


    // Fetch available currencies
    const {
      data: availableCurrencies = [],
      isLoading,
      error,
    } = useQuery({
      queryKey: ["currencies", "active", isAdmin ? "admin" : "public"],
      queryFn: () =>
        isAdmin
          ? adminCurrencyService.getActiveCurrencies()
          : currencyService.getActiveCurrencies(),
      staleTime: 120 * 60 * 1000, // cache for 2 hours
      refetchOnWindowFocus: false,
    });


    // Update selected currency
    const updateCurrency = useCallback((currency: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, currency);
        }
        setSelectedCurrency(currency);
    }, []);


    // Validate saved currency on mount and when available currencies change
    useEffect(() => {
        if (!isLoading && availableCurrencies.length > 0) {
            const isValidCurrency = availableCurrencies.some(
                curr => curr.code === selectedCurrency
            );

            if (!isValidCurrency) {
                console.warn(`Invaild currency ${selectedCurrency}. Resetting to default.`);
                updateCurrency(DEFAULT_CURRENCY);
            };
        };
    }, [isLoading, availableCurrencies, selectedCurrency, updateCurrency]);


    const value = {
        selectedCurrency,
        updateCurrency,
        availableCurrencies,
        isLoading,
        error: error as Error | null,
    };


    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}


export function useCurrency(): CurrencyContextType {
    const context = useContext(CurrencyContext);

    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    };

    return context;
};