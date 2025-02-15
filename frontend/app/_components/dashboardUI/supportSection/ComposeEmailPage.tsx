'use client';

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import EmailComposer from "@/app/_components/dashboardUI/supportSection/EmailComposer";
import { EmailPreviewModal } from "@/app/_components/dashboardUI/supportSection/EmailPreviewModal";
import { EmailItem } from "@/src/types";
import { adminCustomerSupportService } from "@/src/libs/services/adminServices/adminCustomerSupportService";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";


export default function ComposeEmailPage() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const [previewEmail, setPreviewEmail] = useState<EmailItem | null>(null);


  // Fetch draft data if editing
  const { data: draftData, isLoading } = useQuery({
    queryKey: ["email-draft", draftId],
    queryFn: () =>
      draftId ? adminCustomerSupportService.getEmail(draftId) : null,
    enabled: !!draftId, // Only fetch if draftId exists
  });


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 md:px-0 md:mt-4 md:h-screen lg:landscape:h-auto xl:-mt-4">
      <Breadcrumb />

      <div className="px-4">
        <h1 className="text-2xl lg:landscape:text-xl font-semibold text-gray-900">
          {draftId ? "Edit Draft" : "Compose Email"}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 md:h-[92%] lg:landscape:h-full">
        <EmailComposer
          draftId={draftId || undefined}
          initialData={draftData || undefined}
          onPreview={(email) => setPreviewEmail(email)}
        />
      </div>

      <EmailPreviewModal
        isOpen={previewEmail !== null}
        onClose={() => setPreviewEmail(null)}
        email={previewEmail}
      />
    </div>
  );
}