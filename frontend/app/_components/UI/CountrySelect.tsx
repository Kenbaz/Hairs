import { useQuery } from "@tanstack/react-query";
import { Fragment } from "react";
import { Currency } from "@/src/types";
import { currencyService } from "@/src/libs/services/customerServices/currencyService";
import { Listbox, ListboxOption, ListboxButton, ListboxOptions, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";


interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const CURRENCY_COUNTRY_MAP: Record<string, string> = {
  USD: "United States",
  CAD: "Canada",
  NGN: "Nigeria",
  GBP: "United Kingdom",
};

export default function CountrySelect({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = "",
}: CountrySelectProps) {
  // Fetch active currencies
  const { data: currencies, isLoading } = useQuery<Currency[]>({
    queryKey: ["active-currencies"],
    queryFn: () => currencyService.getActiveCurrencies(),
  });

  // Generate list of available countries based on active currencies
  const availableCountries =
    currencies
      ?.filter(
        (currency) => currency.is_active && CURRENCY_COUNTRY_MAP[currency.code]
      )
      .map((currency) => ({
        code: currency.code,
        country: CURRENCY_COUNTRY_MAP[currency.code],
      }))
      .sort((a, b) => a.country.localeCompare(b.country)) || [];

  if (isLoading) {
    return (
      <div className="flex h-10 items-center px-3 border border-gray-300 rounded-lg bg-gray-50">
        <div className="animate-pulse bg-gray-200 h-4 w-full rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Country {required && <span className="text-red-500">*</span>}
      </label>

      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative mt-1">
          <ListboxButton
            className={`relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-75 shadow-sm
            ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
            ${error ? "border-red-500" : ""}
            ${className}`}
          >
            <span className="block truncate">
              {value || "Select a country"}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <ListboxOption
                key="empty"
                value=""
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    active ? "bg-gray-200 text-blue-900" : "text-gray-900"
                  }`
                }
              >
                {({ selected, active }) => (
                  <>
                    <span
                      className={`block truncate ${
                        selected ? "font-medium" : "font-normal"
                      }`}
                    >
                      Select a country
                    </span>
                    {selected ? (
                      <span
                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                          active ? "text-gray-900" : "text-gray-700"
                        }`}
                      >
                        <Check className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </ListboxOption>

              {availableCountries.map((country) => (
                <ListboxOption
                  key={country.code}
                  value={country.country}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-900"
                    }`
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {country.country}
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? "text-gray-900" : "text-gray-700"
                          }`}
                        >
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

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
