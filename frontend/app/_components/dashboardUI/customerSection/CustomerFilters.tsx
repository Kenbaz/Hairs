import { UserFilters } from "@/src/types";
import { FilterDropdown } from "../../UI/FilterDropdown";


interface CustomerFiltersProps {
  filters: UserFilters & { page: number; page_size: number };
  onChange: (filters: Partial<UserFilters>) => void;
}


export default function CustomerFilters({
  filters,
  onChange,
}: CustomerFiltersProps) {
  const CUSTOMER_STATUS_FILTER_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  const VERIFY_EMAIL_FILTER_OPTIONS = [
    { value: "", label: "All" },
    { value: "true", label: "Verified" },
    { value: "false", label: "Unverified" },
  ];


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white mb-5">
      <FilterDropdown
        label="Status"
        options={CUSTOMER_STATUS_FILTER_OPTIONS}
        value={filters.is_active?.toString() ?? ""}
        onChange={(value) =>
          onChange({
            is_active: value === "" ? undefined : value === "true",
          })
        }
      />

      <FilterDropdown
        label="Verified Email"
        options={VERIFY_EMAIL_FILTER_OPTIONS}
        value={filters.verified_email?.toString() ?? ""}
        onChange={(value) =>
          onChange({
            verified_email: value === "" ? undefined : value === "true",
          })
        }
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Join Date
        </label>
        <input
          type="date"
          className="w-full rounded-lg border-gray-300 shadow-sm bg-gray-50 py-2 pl-3 pr-10 text-gray-500 focus:outline-none focus:ring-1 focus:ring-slate-700"
          value={filters.joined_after || ""}
          onChange={(e) =>
            onChange({
              joined_after: e.target.value || undefined,
            })
          }
          placeholder="Joined after"
        />
      </div>
    </div>
  );
}
