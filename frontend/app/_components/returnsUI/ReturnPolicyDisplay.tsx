import { EffectivePolicy } from "@/src/types";
import { Clock, DollarSign, Truck, AlertCircle } from "lucide-react";

interface ReturnPolicyDisplayProps {
  policy: EffectivePolicy;
  className?: string;
}

export function ReturnPolicyDisplay({
  policy,
  className = "",
}: ReturnPolicyDisplayProps) {
  if (!policy.is_returnable) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">This item cannot be returned</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Return Window */}
        <div className="flex items-start space-x-3">
          <Clock className="h-5 w-5 text-gray-400" />
          <div>
            <h4 className="font-medium text-gray-900">Return Window</h4>
            <p className="text-sm text-gray-500">
              {policy.return_window_days} days from delivery
            </p>
          </div>
        </div>

        {/* Shipping Cost */}
        <div className="flex items-start space-x-3">
          <Truck className="h-5 w-5 text-gray-400" />
          <div>
            <h4 className="font-medium text-gray-900">Return Shipping</h4>
            <p className="text-sm text-gray-500">
              {policy.free_returns
                ? "Free Returns"
                : `Paid by ${policy.shipping_paid_by}`}
            </p>
          </div>
        </div>

        {/* Restocking Fee */}
        {policy.restocking_fee_percentage > 0 && (
          <div className="flex items-start space-x-3">
            <DollarSign className="h-5 w-5 text-gray-400" />
            <div>
              <h4 className="font-medium text-gray-900">Restocking Fee</h4>
              <p className="text-sm text-gray-500">
                {policy.restocking_fee_percentage}% of item price
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Return Instructions */}
      {policy.instructions && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Return Instructions
          </h4>
          <p className="text-sm text-gray-500 whitespace-pre-line">
            {policy.instructions}
          </p>
        </div>
      )}
    </div>
  );
}
