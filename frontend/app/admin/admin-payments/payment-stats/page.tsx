import { ReconciliationDashboard } from "@/app/_components/dashboardUI/paymentSection/ReconciliationDashboard";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";

export default function ReconciliationPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Breadcrumb />
          <h1 className="text-2xl font-semibold">Payment Reconciliation</h1>
        </div>
      </div>
      <ReconciliationDashboard />
    </div>
  );
}