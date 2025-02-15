'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/app/_components/UI/Button";
import { Alert } from "@/app/_components/UI/Alert";
import { Input } from "@/app/_components/UI/Input";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { adminShippingService } from "@/src/libs/services/adminServices/adminShippingService";
import { ShippingRate } from "@/src/types";
import { ModalForComponents } from "@/app/_components/UI/ModalForComponents";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConfirmModal } from "../../UI/ConfirmModal";


// Form validation schema
const shippingRateSchema = z.object({
  currency_code: z
    .string()
    .length(3, "Currency code must be 3 characters long"),
  flat_rate: z
    .number()
    .min(0, "Flat rate must be a positive number")
    .transform((val) => Number(val.toFixed(2))),
  is_active: z.boolean().default(true),
});

type ShippingRateFormData = z.infer<typeof shippingRateSchema>;


interface ShippingRateFormProps {
  onSubmit: (data: ShippingRateFormData) => void;
  initialData?: ShippingRate;
  isLoading: boolean;
}


// Form component for creating/editing shipping rates
function ShippingRateForm({ onSubmit, initialData, isLoading }: ShippingRateFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<ShippingRateFormData>({
        resolver: zodResolver(shippingRateSchema),
        defaultValues: initialData || {
            currency_code: '',
            flat_rate: 0,
            is_active: true,
        }
    });


    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <div className="space-y-4">
          <Input
            label="Currency Code"
            {...register("currency_code")}
            error={errors.currency_code?.message}
            placeholder="e.g., USD"
            maxLength={3}
            className="uppercase border rounded-lg text-gray-800"
          />

          <Input
            type="number"
            label="Flat Rate"
            className="border rounded-lg text-gray-800"
            step="0.01"
            {...register("flat_rate", { valueAsNumber: true })}
            error={errors.flat_rate?.message}
          />

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("is_active")}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="bg-slate-700 hover:bg-slate-800"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update" : "Create"} Shipping Rate
        </Button>
      </form>
    );
};


function formatRate(rate: number | string): string {
  const numRate = typeof rate === "string" ? parseFloat(rate) : rate;
  return Number(numRate).toFixed(2);
}


export default function ShippingRates() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [rateToDelete, setRateToDelete] = useState<ShippingRate | null>(null);
    const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
    const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    
    const showAlert = (type: "success" | "error", message: string) => {
      setAlert({ type, message });
      setTimeout(() => setAlert(null), 5000);
    };


    // Fetch shipping rates
    const { data, isLoading } = useQuery({
        queryKey: ['shipping-rates'],
        queryFn: () => adminShippingService.getShippingRates(),
    });


    // Create shipping rate
    const createRateMutation = useMutation({
        mutationFn: (data: ShippingRateFormData) => adminShippingService.createShippingRate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
            showAlert('success', 'Shipping rate created successfully');
            setIsModalOpen(false);
        },
        onError: () => {
          showAlert('error', 'Failed to create shipping rate');
        },
    });


    // Update shipping rate
    const updateRateMutation = useMutation({
      mutationFn: ({ id, data }: { id: number; data: ShippingRateFormData }) =>
        adminShippingService.updateShippingRate(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["shipping-rates"] });
        showAlert('success', 'Shipping rate updated successfully');
        setIsModalOpen(false);
        setSelectedRate(null);
      },
      onError: () => {
        showAlert('error', 'Failed to update shipping rate');
      },
    });


    // Delete shipping rate
    const deleteRateMutation = useMutation({
        mutationFn: (id: number) => adminShippingService.deleteShippingRate(id),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
          showAlert('success', 'Shipping rate deleted successfully');
          setDeleteModalOpen(false);
          setRateToDelete(null);
        },
        onError: () => {
          showAlert('error', 'Failed to delete shipping rate');  
          setDeleteModalOpen(false);
        },
    });
  
  
     const handleDeleteClick = (rate: ShippingRate) => {
       setRateToDelete(rate);
       setDeleteModalOpen(true);
     };

     const handleConfirmDelete = () => {
       if (rateToDelete) {
         deleteRateMutation.mutate(rateToDelete.id);
       }
     };


    const handleSubmit = (data: ShippingRateFormData) => {
        if (selectedRate) {
            updateRateMutation.mutate({ id: selectedRate.id, data });
        } else {
            createRateMutation.mutate(data);
        }
    };


    return (
      <div className=" max-w-6xl mx-auto h-full">
        <div className="md:hidden mb-6 space-y-7">
          <h1 className="text-2xl font-semibold text-gray-900">
            Shipping Rates
          </h1>
          <div className="flex items-center justify-between">
            <div></div>
            <Button
              className="bg-slate-700 hover:bg-slate-800"
              onClick={() => {
                setSelectedRate(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Shipping Rate
            </Button>
          </div>
        </div>
        <div className="hidden mb-6 md:flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Shipping Rates
          </h1>
          <Button
            className="bg-slate-700 hover:bg-slate-800"
            onClick={() => {
              setSelectedRate(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Shipping Rate
          </Button>
        </div>

        {alert && (
          <Alert type={alert.type} message={alert.message} className="mb-4" />
        )}

        {isLoading ? (
          <div className="flex justify-center my-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
          </div>
        ) : (
          <div className="bg-white h-[90%] shadow-sm rounded-lg overflow-hidden py-1">
            <div className="overflow-x-auto border-b">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-[0.8rem] md:text-base lg:landscape:text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Currency
                    </th>
                    <th className="px-6 py-3 text-left text-[0.8rem] md:text-base lg:landscape:text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Flat Rate
                    </th>
                    <th className="px-6 py-3 text-left text-[0.8rem] md:text-base lg:landscape:text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-[0.8rem] md:text-base lg:landscape:text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-[0.8rem] md:text-base lg:landscape:text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.results.map((rate) => (
                    <tr key={rate.id}>
                      <td className="px-6 py-4 md:text-base lg:landscape:text-sm text-gray-900 whitespace-nowrap">
                        {rate.currency_code}
                      </td>
                      <td className="px-6 py-4 md:text-base lg:landscape:text-sm text-gray-900 whitespace-nowrap">
                        {formatRate(rate.flat_rate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-[0.8rem] leading-5 font-semibold rounded-full ${
                            rate.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {rate.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base lg:landscape:text-sm text-gray-700">
                        {new Date(rate.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm md:text-base lg:landscape:text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedRate(rate);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(rate)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data?.results.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No shipping rates found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        <ModalForComponents
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRate(null);
          }}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {selectedRate ? "Edit Shipping Rate" : "Add Shipping Rate"}
            </h3>
            <ShippingRateForm
              onSubmit={handleSubmit}
              initialData={selectedRate || undefined}
              isLoading={
                createRateMutation.isPending || updateRateMutation.isPending
              }
            />
          </div>
        </ModalForComponents>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setRateToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Shipping Rate"
          message={`Are you sure you want to delete the shipping rate for ${rateToDelete?.currency_code}? This action cannot be undone.`}
          confirmText="Delete Rate"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    );
}