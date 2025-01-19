import { PaymentList } from "@/app/_components/dashboardUI/paymentSection/PaymentList";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";

export default function PaymentListingPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Breadcrumb />
          <h1 className="text-2xl font-semibold">Payments</h1>
        </div>
      </div>
      <PaymentList />
    </div>
  );
}