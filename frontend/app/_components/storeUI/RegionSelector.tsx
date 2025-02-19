"use client";

import { useCurrency } from "../_providers/CurrencyContext";
import { Loader2, ChevronDown } from "lucide-react";
import {
  Listbox,
  ListboxOption,
  ListboxButton,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { Fragment } from "react";

interface RegionSelectorProps {
  className?: string;
}

export function RegionSelector({ className = "" }: RegionSelectorProps) {

  const {
    selectedCurrency,
    updateCurrency,
    availableCurrencies,
    isLoading,
    error,
  } = useCurrency();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (error || !availableCurrencies.length) return null;

  return (
    <div className={`relative ${className}`}>
      <Listbox value={selectedCurrency} onChange={updateCurrency}>
        <div className="relative">
          <ListboxButton
            className="flex w-[30vw] md:w-[20vw] lg:landscape:w-[14vw] items-center justify-between rounded-lg border bg-white px-3 py-2 text-gray-800 shadow-sm text-base lg:landscape:text-sm 2xl:currency-list-style  
                      focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm md:text-base"
          >
            <span>
              {
                availableCurrencies.find((c) => c.code === selectedCurrency)
                  ?.symbol
              }{" "}
              {selectedCurrency}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </ListboxButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <ListboxOptions className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none md:text-base sm:text-sm lg:landscape:text-sm xl:overide">
              {availableCurrencies.map((currency) => (
                <ListboxOption
                  key={currency.code}
                  value={currency.code}
                  className={({ active }) =>
                    `cursor-pointer select-none px-3 py-2 ${
                      active ? "bg-gray-100" : ""
                    }`
                  }
                >
                  {({ selected }) => (
                    <span
                      className={`flex items-center ${
                        selected ? "font-medium text-blue-600" : "text-gray-800"
                      }`}
                    >
                      {currency.symbol} {currency.code}
                    </span>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
