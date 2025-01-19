import { TransactionTable } from "@/app/_components/dashboardUI/paymentSection/TransactionTable";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";


export default function TransactionLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Breadcrumb />
          <h1 className="text-2xl font-semibold">Transaction Logs</h1>
        </div>
      </div>
      <TransactionTable />
    </div>
  );
}