'use client';

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { adminCurrencyService } from "@/src/libs/services/adminServices/adminCurrencyService";
import { Button } from "../../UI/Button";
import { Input } from "../../UI/Input";
import { Alert } from "../../UI/Alert";
import { X } from "lucide-react";
import { Currency, CreateCurrencyData, ApiError } from "@/src/types";
import { AxiosError } from "axios";


interface CreateCurrencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface CurrencyFormData {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: string;
}


export function CreateCurrencyModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateCurrencyModalProps) { 
    const [formData, setFormData] = useState<CurrencyFormData>({
        code: "",
        name: "",
        symbol: "",
        exchange_rate: '',
    });

    const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);


    const showAlert = (type: "success" | "error", message: string) => {
      setAlert({ type, message });
      setTimeout(() => setAlert(null), 5000);
    };


    const createCurrencyMutation = useMutation({
        mutationFn: async (data: CurrencyFormData): Promise<Currency> => {
            const createData: CreateCurrencyData = {
                ...data,
                exchange_rate: parseFloat(data.exchange_rate),
                is_active: true,
            };
            return adminCurrencyService.createCurrency(createData);
        },
        onSuccess: () => {
            onSuccess();
            resetForm();
        },
        onError: (error) => {
            const err = error as AxiosError<ApiError>;
            showAlert("error", "Failed to create currency");
            console.error("Currency creation error", err.response?.data);
        }
    })

    const resetForm = () => {
      setFormData({
        code: "",
        name: "",
        symbol: "",
        exchange_rate: "",
      });
      setAlert(null);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAlert(null);

        if (!formData.code || !formData.name || !formData.symbol || !formData.exchange_rate) {
            return showAlert("error", "All fields are required");
        }

        const rate = parseFloat(formData.exchange_rate);
        if (isNaN(rate) || rate <= 0) {
            return showAlert("error", "Invalid exchange rate");
        }

        if (formData.code === "USD") { 
            return showAlert("error", "USD is the base currency and cannot be added");
        }

        // Check if currency code already exists
        try {
            const exists = await adminCurrencyService.checkCurrencyExists(formData.code);
            if (exists) {
                return showAlert("error", "Currency code already exists");
            }

            await createCurrencyMutation.mutateAsync(formData);
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            showAlert("error", "Failed to create currency");
            console.error("Currency creation error", err.response?.data);
        }
    };


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Convert currency code to uppercase
        const processedValue = name === 'code' ? value.toUpperCase() : value;
        setFormData(prev => ({
            ...prev,
            [name]: processedValue,
        }));
    };

    if (!isOpen) return null;


    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Add New Currency
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Error Alert */}
          {alert && (
            <Alert type={alert.type} message={alert.message} className="mb-4" />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Currency Code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., EUR"
                maxLength={3}
                className="uppercase"
                disabled={createCurrencyMutation.isPending}
              />
              <p className="mt-1 text-xs text-gray-500">
                3-letter currency code (e.g., EUR, GBP)
              </p>
            </div>

            <div>
              <Input
                label="Currency Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Euro"
                disabled={createCurrencyMutation.isPending}
              />
            </div>

            <div>
              <Input
                label="Currency Symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="e.g., €"
                maxLength={5}
                disabled={createCurrencyMutation.isPending}
              />
            </div>

            <div>
              <Input
                label="Exchange Rate (1 USD =)"
                name="exchange_rate"
                type="number"
                value={formData.exchange_rate}
                onChange={handleInputChange}
                placeholder="e.g., 0.85"
                step="0.000001"
                min="0.000001"
                disabled={createCurrencyMutation.isPending}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter how many units of this currency equal 1 USD
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createCurrencyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createCurrencyMutation.isPending}
                disabled={createCurrencyMutation.isPending}
              >
                Add Currency
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
}