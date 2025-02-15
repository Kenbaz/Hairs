import { OrderFilters } from "@/src/types";
import { Input } from "../../UI/Input";
import { FilterDropdown } from "../../UI/FilterDropdown";

interface FilterPanelProps {
  filters: OrderFilters;
  onChange: (filters: Partial<OrderFilters>) => void;
}

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const ORDER_STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const PAYMENT_STATUS_OPTIONS = [
    { value: "", label: "All" },
    { value: "true", label: "Paid" },
    { value: "false", label: "Unpaid" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white mb-4">
      <FilterDropdown
        label="Order Status"
        options={ORDER_STATUS_OPTIONS}
        value={filters.status || ""}
        onChange={(value) => onChange({ status: value })}
      />

      <FilterDropdown
        label="Payment Status"
        options={PAYMENT_STATUS_OPTIONS}
        value={filters.payment_status || ""}
        onChange={(value) => onChange({ payment_status: value })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
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
