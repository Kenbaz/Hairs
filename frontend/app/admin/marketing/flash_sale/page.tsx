import FlashSalesList from "@/app/_components/dashboardUI/flashSaleSection/FlashSaleList";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";

export default function FlashSaleListPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb/>
      <FlashSalesList />
    </div>
  )
}