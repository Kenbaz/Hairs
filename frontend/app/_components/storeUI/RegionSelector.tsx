"use client";

import { Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import { ChevronDown, Check } from "lucide-react";
import { useCurrency } from "../_providers/CurrencyContext";

interface RegionSelectorProps {
  className?: string;
  variant?: "default" | "mobile";
}

export function RegionSelector({
  className = "",
  variant = "default",
}: RegionSelectorProps) {
  const {
    selectedCurrency,
    updateCurrency,
    availableCurrencies,
    isLoading,
    error,
  } = useCurrency();

  if (isLoading) {
    return (
      <div
        className={`flex items-center space-x-2 px-3 py-2 text-gray-500 ${className}`}
      >
        <div className="animate-pulse bg-gray-200 h-4 w-20 rounded" />
      </div>
    );
  }

  if (error || !availableCurrencies.length) return null;

  // Determine styling based on variant
  const variantStyles = {
    default: {
      button:
        "w-full md:w-[200px] flex items-center justify-between bg-white px-3 py-3 text-gray-800 shadow-sm",
      optionsContainer:
        "absolute z-10 mt-1 w-full text-gray-700 max-h-60 overflow-auto bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
      optionBase: "cursor-pointer select-none relative py-2 pl-10 pr-4",
      optionActive: "bg-gray-100 text-gray-700",
      optionSelected: "bg-gray-50 text-gray-900",
    },
    mobile: {
      button:
        "w-full flex items-center justify-between py-3 px-4 text-gray-800 hover:bg-gray-50",
      optionsContainer: "overflow-auto max-h-60 text-gray-800",
      optionBase: "cursor-pointer select-none relative py-2 pl-10 pr-4",
      optionActive: "bg-gray-100",
      optionSelected: "bg-gray-50 text-gray-900",
    },
  };

  const styles = variantStyles[variant];

  return (
    <Listbox value={selectedCurrency} onChange={updateCurrency}>
      <div className="relative">
        <ListboxButton className={styles.button}>
          <span>
            {
              availableCurrencies.find((c) => c.code === selectedCurrency)
                ?.symbol
            }{" "}
            {selectedCurrency}{" | "}
            {
              availableCurrencies.find((c) => c.code === selectedCurrency)
                ?.name
            }
          </span>
          <ChevronDown className="h-5 w-5 text-gray-500" />
        </ListboxButton>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className={styles.optionsContainer}>
            {availableCurrencies.map((currency) => (
              <ListboxOption
                key={currency.code}
                value={currency.code}
                className={({ active, selected }) => `
                  ${styles.optionBase}
                  ${active ? styles.optionActive : ""}
                  ${selected ? styles.optionSelected : ""}
                `}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate ${
                        selected ? "font-medium" : "font-normal"
                      }`}
                    >
                      {currency.symbol} {currency.code} | {currency.name}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-800">
                        <Check className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
}
