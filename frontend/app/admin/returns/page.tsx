import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import ReturnPolicyManagement from "@/app/_components/dashboardUI/returnsPolicySection/ReturnPolicyMgt";


export default function ReturnPolicyPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb />
      <ReturnPolicyManagement />
    </div>
  );
}
