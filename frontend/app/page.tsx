import Homepage from "./_components/pages/Homepage";
import { MainLayout } from "./_components/storeUI/MainLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Miz Viv Hairs - Premium Quality Hair Products",
  description:
    "Discover our collection of premium wigs, extensions, and hair care products. Shop the finest quality hair products at Miz Viv Hairs.",
};

export default function Home() {
  return (
    <MainLayout>
      <Homepage />
    </MainLayout>
  );
}
