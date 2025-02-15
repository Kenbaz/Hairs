import { ReturnFiltersType } from "@/src/types";
import { Input } from "../../UI/Input";
import { FilterDropdown } from "../../UI/FilterDropdown";

interface FilterPanelProps {
  filters: ReturnFiltersType;
  onChange: (filters: Partial<ReturnFiltersType>) => void;
}

export default function ReturnFilters({ filters, onChange }: FilterPanelProps) {
  const RETURN_STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "completed", label: "Completed" },
  ];

  const REFUND_STATUS_OPTIONS = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white mb-4">
      <FilterDropdown
        label="Return Status"
        options={RETURN_STATUS_OPTIONS}
        value={filters.status || ""}
        onChange={(value) => onChange({ status: value })}
      />

      <FilterDropdown
        label="Refund Status"
        options={REFUND_STATUS_OPTIONS}
        value={filters.refund_status || ""}
        onChange={(value) => onChange({ refund_status: value || undefined })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date Range
        </label>
        <div className="grid grid-cols-2 md:flex gap-2 md:gap-4 w-full">
          <Input
            type="date"
            className="rounded-lg border text-gray-500"
            value={filters.date_from || ""}
            onChange={(e) => onChange({ date_from: e.target.value })}
            placeholder="From"
          />
          <Input
            type="date"
            className="rounded-lg border text-gray-500"
            value={filters.date_to || ""}
            onChange={(e) => onChange({ date_to: e.target.value })}
            placeholder="To"
          />
        </div>
      </div>
    </div>
  );
}
