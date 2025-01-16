"use client";

import FlashSalePage from "@/app/_components/dashboardUI/flashSaleSection/FlashSalePage";
import { use } from "react";

interface EditFlashSalePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditFlashSalePage({ params }: EditFlashSalePageProps) {
  const { id } = use(params);
  
  return <FlashSalePage params={{ id }} />;
}
