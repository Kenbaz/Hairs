import { TransactionTable } from "@/app/_components/dashboardUI/paymentSection/TransactionTable";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";


export default function TransactionLogsPage() {
  return (
    <div className="space-y-6 h-screen px-2 md:px-0 md:mt-4 xl:-mt-4">
      <div className="flex justify-between items-center">
        <div>
          <Breadcrumb />
        </div>
      </div>
      <h1 className="text-2xl text-gray-900 font-semibold">Transaction Logs</h1>
      <TransactionTable />
    </div>
  );
}