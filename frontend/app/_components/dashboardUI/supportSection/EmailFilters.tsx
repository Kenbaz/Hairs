import { Input } from "../../UI/Input";
import { EmailFilters } from "@/src/types";

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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          className="w-full rounded-lg border-gray-300 shadow-sm"
          value={filters.status || ""}
          onChange={(e) => onChange({ status: e.target.value })}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Priority
        </label>
        <select
          className="w-full rounded-lg border-gray-300 shadow-sm"
          value={filters.priority || ""}
          onChange={(e) => onChange({ priority: e.target.value })}
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          From Date
        </label>
        <Input
          type="date"
          value={filters.date_from || ""}
          onChange={(e) => onChange({ date_from: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          To Date
        </label>
        <Input
          type="date"
          value={filters.date_to || ""}
          onChange={(e) => onChange({ date_to: e.target.value })}
        />
      </div>
    </div>
  );
}
