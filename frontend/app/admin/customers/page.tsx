import CustomerListPage from "@/app/_components/dashboardUI/customerSection/CustomerList";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";


export default function CustomerPage() {
  return (
    <div className="space-y-6 md:mt-4 xl:-mt-4 2xl:-mt-[1.5%]">
      <div className="pl-2 py-1">
        <Breadcrumb />
      </div>

      <CustomerListPage />
    </div>
  );
}