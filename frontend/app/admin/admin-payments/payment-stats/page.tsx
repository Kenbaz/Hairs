import { ReconciliationDashboard } from "@/app/_components/dashboardUI/paymentSection/ReconciliationDashboard";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";

export default function ReconciliationPage() {
  return (
    <div className="space-y-6 px-2 md:px-0 md:mt-4 xl:-mt-4 pb-[14%] md:pb-[4%]">
      <div className="flex justify-between items-center">
        <div>
          <Breadcrumb />
        </div>
      </div>
      <h1 className="text-2xl lg:landscape:text-xl text-gray-900 font-semibold">Payment Reconciliation</h1>
      <ReconciliationDashboard />
    </div>
  );
}