import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import ShippingRates from "@/app/_components/dashboardUI/shippingSection/ShippingRateMgt";

export default function ShippingRatesPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb />
      <ShippingRates />
    </div>
  );
}
