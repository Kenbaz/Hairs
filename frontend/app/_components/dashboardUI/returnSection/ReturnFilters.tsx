import { ReturnFiltersType } from "@/src/types";
import { Input } from "../../UI/Input";


interface FilterPanelProps {
  filters: ReturnFiltersType;
  onChange: (filters: Partial<ReturnFiltersType>) => void;
}


export default function ReturnFilters({ filters, onChange }: FilterPanelProps) {
  const RETURN_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "completed", label: "Completed" },
  ];

  const REFUND_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Return Status
        </label>
        <select
          className="w-full rounded-lg border-gray-300 shadow-sm"
          value={filters.status || ""}
          onChange={(e) => onChange({ status: e.target.value })}
        >
          <option value="">All Statuses</option>
          {RETURN_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Refund Status
        </label>
        <select
          className="w-full rounded-lg border-gray-300 shadow-sm"
          value={filters.refund_status || ""}
          onChange={(e) => onChange({ refund_status: e.target.value })}
        >
          <option value="">All</option>
          {REFUND_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date Range
        </label>
        <div className="flex gap-2">
          <Input
            type="date"
            value={filters.date_from || ""}
            onChange={(e) => onChange({ date_from: e.target.value })}
            placeholder="From"
          />
          <Input
            type="date"
            value={filters.date_to || ""}
            onChange={(e) => onChange({ date_to: e.target.value })}
            placeholder="To"
          />
        </div>
      </div>
    </div>
  );
}
