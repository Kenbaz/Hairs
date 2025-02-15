import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import ReturnPolicyManagement from "@/app/_components/dashboardUI/returnsPolicySection/ReturnPolicyMgt";


export default function ReturnPolicyPage() {
  return (
    <div className="space-y-6 px-2 md:px-0 md:mt-4 xl:-mt-4 pb-[14%] lg:landscape:pb-0 md:h-screen">
      <Breadcrumb />
      <ReturnPolicyManagement />
    </div>
  );
}
