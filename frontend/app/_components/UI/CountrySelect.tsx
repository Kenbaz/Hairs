import { useQuery } from "@tanstack/react-query";
import { Currency } from "@/src/types";
import { publicCurrencyService } from "@/src/libs/services/customerServices/publicCurrencyService";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const CURRENCY_COUNTRY_MAP: Record<string, string> = {
  'USD': "United States",
  'CAD': "Canada",
  'NGN': "Nigeria",
  'GBP': "United Kingdom",
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
    queryFn: () => publicCurrencyService.getPublicCurrencies(),
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg 
          focus:ring-2 focus:ring-blue-500 focus:border-transparent 
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? "border-red-500" : ""}
          ${className}`}
        disabled={disabled}
        required={required}
      >
        <option value="">Select a country</option>
        {availableCountries.map(({ code, country }) => (
          <option key={code} value={country}>
            {country}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
