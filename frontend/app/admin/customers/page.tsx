import CustomerListPage from "@/app/_components/dashboardUI/customerSection/CustomerList";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";


export default function CustomerPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb />
      <CustomerListPage />
    </div>
  );
}