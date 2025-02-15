import { Input } from "../../UI/Input";
import { EmailFilters } from "@/src/types";
import { FilterDropdown } from "../../UI/FilterDropdown";


interface EmailFilterPanelProps {
  filters: EmailFilters;
  onChange: (filters: Partial<EmailFilters>) => void;
}

export function EmailFilterPanel({ filters, onChange }: EmailFilterPanelProps) {
  const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "read", label: "Read" },
    { value: "delivered", label: "Delivered" },
    { value: "failed", label: "Failed" },
  ];

    
  const PRIORITY_OPTIONS = [
    { value: "", label: "All Priority" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

    
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white mb-4">
      <FilterDropdown
        label="Status"
        options={STATUS_OPTIONS}
        value={filters.status || ""}
        onChange={(value) => onChange({ status: value })}
      />

      <FilterDropdown
        label="Priority"
        options={PRIORITY_OPTIONS}
        value={filters.priority || ""}
        onChange={(value) => onChange({ priority: value })}
      />

      
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <Input
            type="date"
            className="rounded-lg border text-gray-500"
            value={filters.date_from || ""}
            onChange={(e) => onChange({ date_from: e.target.value })}
            placeholder="From"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <Input
            type="date"
            className="rounded-lg border text-gray-500"
            value={filters.date_to || ""}
            onChange={(e) => onChange({ date_to: e.target.value })}
            placeholder="To"
          />
        </div>
      
    </div>
  );
}
