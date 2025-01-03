'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminCurrencyService } from "@/src/libs/services/adminServices/adminCurrencyService";
import { Breadcrumb } from "@/app/_components/UI/Breadcrumb";
import { Button } from "@/app/_components/UI/Button";
import { Alert } from "@/app/_components/UI/Alert";
import { Loader2, Plus } from "lucide-react";
import { CurrencyList } from "./CurrencyList";
import { CreateCurrencyModal } from "./CurrencyUpdateModal";
import type { Currency } from "@/src/types";


export default function CurrencyManagementPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);


    const {
        data: currencies,
        isLoading,
        refetch,
        error,
    } = useQuery<Currency[]>({
        queryKey: ['admin', 'currencies'],
        queryFn: () => adminCurrencyService.getCurrencies(),
    });


    const showAlert = (type: "success" | "error", message: string) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 5000);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    };

    if (error) {
        return (
            <div className="p-4">
                <Alert type="error" message="Failed to load currencies" />
            </div>
        );
    }


    return (
    <div className="space-y-6">
      <div className="px-4 py-2">
        <Breadcrumb />
      </div>

      {alert && (
        <Alert type={alert.type} message={alert.message} className="mb-4" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Currency Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage exchange rates and available currencies
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Currency
        </Button>
      </div>

      {/* Currency List */}
      <CurrencyList
        currencies={currencies || []}
        onUpdate={() => {
          refetch();
          showAlert('success', 'Currency updated successfully');
        }}
      />

      {/* Create Currency Modal */}
      <CreateCurrencyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
          showAlert('success', 'Currency added successfully');
        }}
      />
    </div>
  );
}