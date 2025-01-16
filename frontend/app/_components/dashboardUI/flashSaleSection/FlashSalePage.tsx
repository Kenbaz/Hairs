"use client";

import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import FlashSaleForm from "./FlashSaleForm";

interface FlashSalePageProps {
  params: {
    id?: string;
  };
}

export default function FlashSalePage({ params }: FlashSalePageProps) {
  const flashSaleId = params.id ? parseInt(params.id) : undefined;

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <FlashSaleForm flashSaleId={flashSaleId} />
    </div>
  );
}
