"use client";

import { Button } from "@/app/_components/UI/Button";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
      <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Something went wrong!
      </h2>
      <p className="text-gray-500 text-center max-w-md mb-6">
        We encountered an error while loading your cart. Please try again or
        contact support if the problem persists.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
