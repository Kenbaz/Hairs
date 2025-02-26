import UserDashboardLayout from "@/app/_components/storeUI/UserDashboardLayout";
import { AuthGuard } from "@/app/_components/guards/RouteGuards";

interface DashboardPageProps {
  children: React.ReactNode;
}

export default function DashboardPage({ children }: DashboardPageProps) {
  return (
    <AuthGuard>
      <UserDashboardLayout>{children}</UserDashboardLayout>
    </AuthGuard>
  );
}
