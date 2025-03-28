"use client";

import { useState, Fragment } from "react";
import { Button } from "@/app/_components/UI/Button";
import { Input } from "@/app/_components/UI/Input";
import {
  ReturnPolicy,
} from "@/src/types";
import {
  Listbox,
  Transition,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronsUpDown } from "lucide-react";


const shippingOptions = [
  { id: "store", name: "Store" },
  { id: "customer", name: "Customer" },
];


export const GlobalPolicyForm = ({
  policy,
  isLoading,
  onSubmit,
}: {
  policy: ReturnPolicy | null | undefined;
  isLoading: boolean;
  onSubmit: (data: ReturnPolicy) => void;
}) => {
    const [inputValues, setInputValues] = useState({
      return_window_days: policy?.return_window_days?.toString() ?? "30",
      restocking_fee_percentage:
        policy?.restocking_fee_percentage?.toString() ?? "0",
    });

  const [formData, setFormData] = useState<ReturnPolicy>(
    policy ?? {
      return_window_days: 30,
      requires_receipt: true,
      allow_partial_returns: true,
      restocking_fee_percentage: 0,
      free_returns: true,
      shipping_paid_by: "customer",
      return_instructions: "",
    }
  );
  
    
   const handleNumberChange = (
     field: "return_window_days" | "restocking_fee_percentage",
     value: string
   ) => {
     // Update the input value directly
     setInputValues((prev) => ({
       ...prev,
       [field]: value,
     }));

     // Update the form data with the parsed number
     const numValue = value === "" ? 0 : parseInt(value);
     if (!isNaN(numValue)) {
       setFormData((prev) => ({
         ...prev,
         [field]: numValue,
       }));
     }
   };
   

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure numbers are properly set before submitting
    const submissionData = {
      ...formData,
      return_window_days: parseInt(inputValues.return_window_days) || 0,
      restocking_fee_percentage:
        parseInt(inputValues.restocking_fee_percentage) || 0,
    };
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Return Window */}
        <div>
          <label className="block text-sm md:text-base lg:landscape:text-sm font-medium text-gray-700 mb-1">
            Return Window (Days)
          </label>
          <Input
            type="number"
            className="border rounded-lg text-gray-900"
            min={1}
            value={inputValues.return_window_days}
            onChange={(e) =>
              handleNumberChange("return_window_days", e.target.value)
            }
            required
          />
        </div>

        {/* Restocking Fee */}
        <div>
          <label className="block text-sm md:text-base lg:landscape:text-sm font-medium text-gray-700 mb-1">
            Restocking Fee (%)
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            className="border rounded-lg text-gray-900"
            value={inputValues.restocking_fee_percentage}
            onChange={(e) =>
              handleNumberChange("restocking_fee_percentage", e.target.value)
            }
            required
          />
        </div>
      </div>

      {/* Policy Options */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requires_receipt"
            checked={formData.requires_receipt}
            onChange={(e) =>
              setFormData({
                ...formData,
                requires_receipt: e.target.checked,
              })
            }
            className="rounded border-gray-300"
          />
          <label
            htmlFor="requires_receipt"
            className="text-sm md:text-base lg:landscape:text-sm text-gray-700"
          >
            Require Receipt for Returns
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="allow_partial_returns"
            checked={formData.allow_partial_returns}
            onChange={(e) =>
              setFormData({
                ...formData,
                allow_partial_returns: e.target.checked,
              })
            }
            className="rounded border-gray-300"
          />
          <label
            htmlFor="allow_partial_returns"
            className="text-sm md:text-base lg:landscape:text-sm text-gray-700"
          >
            Allow Partial Returns
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="free_returns"
            checked={formData.free_returns}
            onChange={(e) =>
              setFormData({
                ...formData,
                free_returns: e.target.checked,
              })
            }
            className="rounded border-gray-300"
          />
          <label
            htmlFor="free_returns"
            className="text-sm md:text-base lg:landscape:text-sm text-gray-700"
          >
            Free Returns
          </label>
        </div>
      </div>

      {/* Shipping Paid By */}
      <div className="relative">
        <label className="block text-sm md:text-base lg:landscape:text-sm font-medium text-gray-700 mb-1">
          Return Shipping Paid By
        </label>
        <Listbox
          value={formData.shipping_paid_by}
          onChange={(value) =>
            setFormData({
              ...formData,
              shipping_paid_by: value as "customer" | "store",
            })
          }
        >
          <div className="relative mt-1">
            <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-gray-700 text-left border border-gray-300 focus:outline-none sm:text-sm md:text-base lg:landscape:text-sm">
              <span className="block truncate">
                {formData.shipping_paid_by === "store" ? "Store" : "Customer"}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronsUpDown
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </ListboxButton>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm md:text-base lg:landscape:text-sm">
                {shippingOptions.map((option) => (
                  <ListboxOption
                    key={option.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-3 pr-9 ${
                        active ? "bg-gray-200 text-blue-900" : "text-gray-900"
                      }`
                    }
                    value={option.id}
                  >
                    {({ selected }) => (
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {option.name}
                      </span>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </div>
        </Listbox>
      </div>

      {/* Return Instructions */}
      <div>
        <label className="block text-sm md:text-base lg:landscape:text-sm font-medium text-gray-700 mb-1">
          Return Instructions
        </label>
        <textarea
          value={formData.return_instructions}
          onChange={(e) =>
            setFormData({
              ...formData,
              return_instructions: e.target.value,
            })
          }
          rows={4}
          className="mt-1 block w-full border rounded-md shadow-sm text-gray-900 p-2 text-sm md:text-base lg:landscape:text-sm"
        />
      </div>

      <Button
        type="submit"
        className="bg-slate-700 hover:bg-slate-800"
        isLoading={isLoading}
      >
        {policy ? "Update Global Policy" : "Create Global Policy"}
      </Button>
    </form>
  );
};
