import { UserFilters } from "@/src/types";

interface CustomerFiltersProps {
  filters: UserFilters & { page: number; page_size: number };
  onChange: (filters: Partial<UserFilters>) => void;
}


export default function CustomerFilters({
  filters,
  onChange,
}: CustomerFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          className="w-full rounded-lg border-gray-300 shadow-sm"
          value={filters.is_active?.toString() ?? ""}
          onChange={(e) =>
            onChange({
              is_active:
                e.target.value === "" ? undefined : e.target.value === "true",
            })
          }
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Verified Email
        </label>
        <select
          className="w-full rounded-lg border-gray-300 shadow-sm"
          value={filters.verified_email?.toString() ?? ""}
          onChange={(e) =>
            onChange({
              verified_email:
                e.target.value === "" ? undefined : e.target.value === "true",
            })
          }
        >
          <option value="">All</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Join Date
        </label>
        <input
          type="date"
          className="w-full rounded-lg border-gray-300 shadow-sm"
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
