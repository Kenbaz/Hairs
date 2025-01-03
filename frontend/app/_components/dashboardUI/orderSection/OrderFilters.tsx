import { OrderFilters } from "@/src/types";
import { Input } from "../../UI/Input";


interface FilterPanelProps { 
    filters: OrderFilters;
    onChange: (filters: Partial<OrderFilters>) => void;
}


export default function FilterPanel({ filters, onChange }: FilterPanelProps) { 
    const ORDER_STATUS_OPTIONS = [
      { value: "pending", label: "Pending" },
      { value: "processing", label: "Processing" },
      { value: "shipped", label: "Shipped" },
      { value: "delivered", label: "Delivered" },
      { value: "cancelled", label: "Cancelled" },
    ];


    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Status
          </label>
          <select
            className="w-full rounded-lg border-gray-300 shadow-sm"
            value={filters.status || ""}
            onChange={(e) => onChange({ status: e.target.value })}
          >
            <option value="">All Statuses</option>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Status
          </label>
          <select
            className="w-full rounded-lg border-gray-300 shadow-sm"
            value={String(filters.payment_status || '')}
            onChange={(e) =>
              onChange({
                payment_status: e.target.value || undefined,
              })
            }
          >
            <option value="">All</option>
            <option value="true">Paid</option>
            <option value="false">Unpaid</option>
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