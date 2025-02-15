import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import ShippingRates from "@/app/_components/dashboardUI/shippingSection/ShippingRateMgt";

export default function ShippingRatesPage() {
  return (
    <div className="space-y-6 px-2 md:px-0 md:mt-4 xl:-mt-4 h-screen">
      <Breadcrumb />
      <ShippingRates />
    </div>
  );
}
