import { PaymentList } from "@/app/_components/dashboardUI/paymentSection/PaymentList";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";

export default function PaymentListingPage() {
  return (
    <div className="space-y-6 px-2 md:px-0 md:mt-4 xl:-mt-4 h-screen">
      <div className="flex justify-between items-center">
        <div>
          <Breadcrumb />
        </div>
      </div>
      <h1 className="text-2xl text-gray-900 font-semibold">Payments</h1>
      <PaymentList />
    </div>
  );
}