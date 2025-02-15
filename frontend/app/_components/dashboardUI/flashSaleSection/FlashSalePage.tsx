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
    <div className="space-y-6 pb-[14%] md:pb-[5%] px-2 md:px-0 md:mt-4 xl:-mt-4">
      <Breadcrumb />
      <FlashSaleForm flashSaleId={flashSaleId} />
    </div>
  );
}
