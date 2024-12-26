'use client';

import { createContext, useCallback, useContext, useState, useEffect, PropsWithChildren } from "react";
import type { Currency } from "@/src/types";
import { useQuery } from "@tanstack/react-query";
import { adminCurrencyService } from "@/src/libs/services/currencyService";
import { useAppSelector } from "@/src/libs/_redux/hooks";
import { selectIsAuthenticated } from "@/src/libs/_redux/authSlice";


interface CurrencyContextType {
    selectedCurrency: string;
    updateCurrency: (currency: string) => void;
    availableCurrencies: Currency[];
    isLoading: boolean;
    error: Error | null;
}


const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'adminCurrency';
const DEFAULT_CURRENCY = 'USD';


export function CurrencyProvider({ children }: PropsWithChildren) {
    // Get authentication status
    const isAuthenticated = useAppSelector(selectIsAuthenticated);

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
        queryKey: ['admin', 'currencies', 'active'],
        queryFn: () => adminCurrencyService.getActiveCurrencies(),
        staleTime: 5 * 60 * 1000, // data is considered fresh for 5 minutes
        refetchOnWindowFocus: false,
        // Only fetch when authenticated
        enabled: isAuthenticated,
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
        isLoading: isLoading && isAuthenticated,
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