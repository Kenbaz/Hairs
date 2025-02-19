import { MainLayout } from "../_components/storeUI/MainLayout";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
