'use client';

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { adminCurrencyService } from "@/src/libs/services/adminServices/adminCurrencyService";
import { ApiError, Currency } from "@/src/types";
import { Button } from "../../UI/Button";
import { Alert } from "../../UI/Alert";
import { Input } from "../../UI/Input";
import { Edit2, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { AxiosError } from "axios";
import { ConfirmModal } from "../../UI/ConfirmModal";


interface CurrencyListProps { 
    currencies: Currency[];
    onUpdate: () => void;
}


export function CurrencyList({ currencies, onUpdate }: CurrencyListProps) { 
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editRate, setEditRate] = useState<string>("");
    const [currencyToDelete, setCurrencyToDelete] = useState<Currency | null>(null);
    const [alert, setAlert] = useState<{
            type: 'success' | 'error';
            message: string;
        } | null>(null);

    
    const showAlert = (type: "success" | "error", message: string) => {
      setAlert({ type, message });
      setTimeout(() => setAlert(null), 5000);
    };


    const updateRateMutation = useMutation({
      mutationFn: async ({ id, rate }: { id: number; rate: number }) => {
        return adminCurrencyService.updateExchangeRate(id, rate);
      },
      onSuccess: () => {
        setEditingId(null);
        onUpdate();
      },
      onError: (error) => {
            const err = error as AxiosError<ApiError>;
            showAlert("error", "Failed to update exchange rate");
            console.error("Exchange rate update error", err.response?.data);
      },
    });


    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminCurrencyService.deleteCurrency(id),
        onSuccess: () => {
            setCurrencyToDelete(null);
            onUpdate();
        },
        onError: (error) => {
            const err = error as AxiosError<ApiError>;
            showAlert('error', 'Failed to delete currency');
            console.error('Currency delete error', err.response?.data);
        },
    })


    const toggleStatusMutation = useMutation({
      mutationFn: async (id: number) => {
        return adminCurrencyService.toggleStatus(id);
      },
      onSuccess: onUpdate,
      onError: (error) => {
          const err = error as AxiosError<ApiError>
          showAlert('error', 'Failed to update currency status')
          console.error('Failed status toggling error', err.response?.data)
      },
    });


    const handleEdit = (currency: Currency) => {
        setEditingId(currency.id);
        setEditRate(currency.exchange_rate.toString())
    };


    const handleSave = async (id: number) => {
        try {
            const rate = parseFloat(editRate);
            console.log('Validating rate:', { editRate, rate });
            
            // Validation
            if (isNaN(rate)) {
                showAlert('error', 'Please enter a valid exchange rate');
                return;
            }
            if (rate <= 0) {
                showAlert('error', 'Exchange rate must be greater than 0');
                return;
            }
            if (rate >= 10000000) {
                showAlert('error', 'Exchange rate is too high');
                return;
            }

            const decimalPlaces = rate.toString().split('.')[1]?.length || 0;
            if (decimalPlaces > 6) {
                showAlert('error', 'Exchange rate must have a maximum of 6 decimal places');
                return;
            }

            await updateRateMutation.mutateAsync({ id, rate });
        } catch (error) {
            console.error('Handle save error:', error);
        }

    };


    const handleDelete = (currency: Currency) => {
        if (currency.code === 'USD') {
            return showAlert('error', "Base currency can't be deleted");
        }
        setCurrencyToDelete(currency);
    };

    const confirmDelete = async () => {
        if (currencyToDelete) {
            await deleteMutation.mutateAsync(currencyToDelete.id);
        }
    };


    if (currencies.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-gray-500">
            No currencies available
          </div>
        </div>
      );
    }


    return (
      <div className="bg-white rounded-lg shadow">
        {alert && (
          <Alert type={alert.type} message={alert.message} className="mb-4" />
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exchange Rate (1 USD =)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currencies.map((currency) => (
                <tr key={currency.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{currency.symbol}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {currency.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100">
                      {currency.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === currency.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          className="w-32"
                          step="0.000001"
                          min="0.000001"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSave(currency.id)}
                          isLoading={updateRateMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">
                          {currency.exchange_rate}
                        </span>
                        {currency.code !== "USD" && (
                          <button
                            onClick={() => handleEdit(currency)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currency.code === "USD" ? (
                      <span className="text-sm text-gray-500">
                        Base Currency
                      </span>
                    ) : (
                      <button
                        onClick={() => toggleStatusMutation.mutate(currency.id)}
                        className={`text-${
                          currency.is_active ? "green" : "gray"
                        }-600`}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {currency.is_active ? (
                          <ToggleRight className="h-6 w-6" />
                        ) : (
                          <ToggleLeft className="h-6 w-6" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {currency.last_updated
                      ? new Date(currency.last_updated).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {currency.code !== "USD" && (
                      <button
                        onClick={() => handleDelete(currency)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Currency"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(currencyToDelete)}
          onClose={() => setCurrencyToDelete(null)}
          onConfirm={confirmDelete}
          title="Delete Currency"
          message={`Are you sure you want to delete ${currencyToDelete?.name} (${currencyToDelete?.code})? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    );
}