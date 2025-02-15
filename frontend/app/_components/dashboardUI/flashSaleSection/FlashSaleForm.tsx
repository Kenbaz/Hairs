'use client';

import { useEffect, useState, Fragment } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminFlashSaleService } from "@/src/libs/services/adminServices/adminFlashService";
import { FlashSaleProducts } from "@/src/types";
import { Button } from "@/app/_components/UI/Button";
import { Input } from "@/app/_components/UI/Input";
import { Alert } from "@/app/_components/UI/Alert";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PriceDisplay } from "@/app/_components/UI/PriceDisplay";
import { Loader2, Trash2, Check, ChevronDown } from "lucide-react";
import { Listbox, Transition, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';


// Create Zod schema for validation
const flashSaleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z
    .number({
      required_error: "Discount value is required",
      invalid_type_error: "Discount value must be a number",
    })
    .min(0.01, "Discount must be greater than 0")
    .max(100, { message: "Percentage cannot exceed 100%" })
    .refine((val) => val > 0, "Discount must be greater than 0"),
  max_quantity_per_customer: z
    .number()
    .int()
    .min(1, "Maximum quantity per customer must be at least 1"),
  total_quantity_limit: z
    .number()
    .int()
    .min(1, "Total quantity limit must be at least 1")
    .optional(),
  is_visible: z.boolean(),
  products: z
    .array(
      z.object({
        product: z.number({ required_error: "Product is required" }),
        quantity_limit: z
          .number()
          .int()
          .min(1, "Quantity limit must be at least 1")
          .optional(),
      })
    )
    .min(1, "At least one product must be selected"),
});

type FlashSaleFormData = z.infer<typeof flashSaleSchema>;

interface FlashSaleFormProps {
  flashSaleId?: number;
}

type DiscountType = "percentage" | "fixed";

const discountTypes: Array<{ id: DiscountType; name: string }> = [
  { id: "percentage", name: "Percentage" },
  { id: "fixed", name: "Fixed Amount" },
];


export default function FlashSaleForm({ flashSaleId }: FlashSaleFormProps) {
  const router = useRouter();
  const [selectedProducts, setSelectedProducts] = useState<FlashSaleProducts[]>(
    []
  );
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const isEditing = !!flashSaleId;

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Fetch flash sale data if editing
  const { data: flashSale, isLoading: isLoadingFlashSale } = useQuery({
    queryKey: ["flashSale", flashSaleId],
    queryFn: () =>
      flashSaleId ? adminFlashSaleService.getFlashSale(flashSaleId) : null,
    enabled: !!flashSaleId,
  });

  // Fetch available products
  const { data: availableProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["availableProducts"],
    queryFn: () => adminFlashSaleService.getAvailableProducts(),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FlashSaleFormData>({
    resolver: zodResolver(flashSaleSchema),
    defaultValues: {
      name: "",
      description: "",
      start_time: "",
      end_time: "",
      discount_type: "percentage",
      discount_value: 0,
      max_quantity_per_customer: 1,
      is_visible: true,
      products: [],
    },
  });

  // Watch discount type for validation
  const discountType = watch("discount_type");

  // Set form data when editing
  useEffect(() => {
    if (flashSale) {
      reset({
        name: flashSale.name,
        description: flashSale.description,
        start_time: new Date(flashSale.start_time).toISOString().slice(0, 16),
        end_time: new Date(flashSale.end_time).toISOString().slice(0, 16),
        discount_type: flashSale.discount_type,
        discount_value: flashSale.discount_value,
        max_quantity_per_customer: flashSale.max_quantity_per_customer,
        total_quantity_limit: flashSale.total_quantity_limit,
        is_visible: flashSale.is_visible,
        products: flashSale.products.map((p) => ({
          product: p.product,
          quantity_limit: p.quantity_limit,
        })),
      });
      setSelectedProducts(flashSale.products);
    }
  }, [flashSale, reset]);

  useEffect(() => {
    const formattedProducts = selectedProducts.map((product) => ({
      product: product.product,
      quantity_limit: product.quantity_limit || product.stock,
    }));

    reset(
      (formValues) => ({
        ...formValues,
        products: formattedProducts,
      }),
      { keepDefaultValues: true }
    );
  }, [selectedProducts, reset]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
    }
  }, [errors]);

  const onSubmit = async (formData: FlashSaleFormData) => {
    console.log("Form submission triggered", formData);

    // Stop the function if form is already submitting
    if (isSubmitting) return;
    try {
      console.log("Inside try block");
      setAlert(null);

      if (selectedProducts.length === 0) {
        showAlert("error", "Please select at least one product");
        return;
      }

      const productsData = selectedProducts.map((product) => ({
        product: product.product,
        quantity_limit: product.quantity_limit || product.stock,
      }));

      const saleData = {
        name: formData.name,
        description: formData.description || "",
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        max_quantity_per_customer: formData.max_quantity_per_customer,
        total_quantity_limit: formData.total_quantity_limit,
        is_visible: formData.is_visible,
        products_data: productsData, // Send the transformed products data
      };

      console.log("Sale data prepared:", saleData);

      if (isEditing && flashSaleId) {
        await adminFlashSaleService.updateFlashSale({
          id: flashSaleId,
          ...saleData,
        });
        showAlert("success", "Flash sale updated successfully");
      } else {
        await adminFlashSaleService.createFlashSale(saleData);
        showAlert("success", "Flash sale created successfully");
      }

      router.push("/admin/marketing/flash_sale");
    } catch (error) {
      showAlert(
        "error",
        `Failed to ${isEditing ? "update" : "create"} flash sale.`
      );
      console.error("Flash sale form error:", error);
    }
  };

  // Update the product selection handler
 const handleProductSelect = (productId: number) => {
   if (productId && !selectedProducts.find((p) => p.product === productId)) {
     const product = availableProducts?.find((p) => p.id === productId);
     if (product) {
       const newProduct: FlashSaleProducts = {
         id: 0,
         product: product.id,
         product_name: product.name,
         discounted_price: 0,
         original_price: product.price,
         quantity_limit: product.stock,
         quantity_sold: 0,
         stock: product.stock,
       };
       setSelectedProducts((prev) => [...prev, newProduct]);
     }
   }
 };


  const DiscountTypeSelect = () => {
    const selectedType = discountTypes.find(
      (type) => type.id === watch("discount_type")
    );

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-800 mb-1">
          Discount Type
        </label>
        <Listbox
          value={selectedType}
          onChange={(value: (typeof discountTypes)[number]) => {
            // Update the form with the new value
            reset({ ...watch(), discount_type: value.id });
          }}
        >
          <div className="relative mt-1">
            <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-gray-50 py-2 pl-3 pr-10 text-left border focus:outline-none text-gray-900">
              <span className="block truncate">{selectedType?.name}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDown
                  className="h-5 w-5 text-gray-600"
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
              <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 md:text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm lg:landscape:text-[0.9rem]">
                {discountTypes.map((type) => (
                  <ListboxOption
                    key={type.id}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                        active ? "bg-gray-200 text-blue-900" : "text-gray-900"
                      }`
                    }
                    value={type}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {type.name}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </div>
        </Listbox>
      </div>
    );
  };


  const ProductSelect = () => {
    return (
      <div className="relative">
        <label className="block text-[0.9rem] font-medium text-gray-700 mb-1">
          Add Products
        </label>
        <Listbox onChange={handleProductSelect}>
          <div className="relative mt-1">
            <ListboxButton className="relative text-gray-700 w-full cursor-pointer rounded-lg bg-gray-50 py-2 pl-3 pr-10 text-left border focus:outline-none">
              <span className="block truncate">Select a product</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDown
                  className="h-5 w-5 text-gray-600"
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
              <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto border rounded-md bg-white py-1 md:text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm lg:landscape:text-[0.9rem]">
                {availableProducts?.map((product) => (
                  <ListboxOption
                    key={product.id}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                        active ? "bg-gray-200 text-blue-900" : "text-gray-900"
                      }`
                    }
                    value={product.id}
                    disabled={selectedProducts.some(
                      (p) => p.product === product.id
                    )}
                  >
                    {({ selected, disabled }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          } ${disabled ? "text-gray-400" : ""}`}
                        >
                          {product.name} - Stock: {product.stock}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </div>
        </Listbox>
      </div>
    );
  };


  if (isLoadingFlashSale || isLoadingProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl text-gray-900 font-semibold mb-6">
        {isEditing ? "Edit Flash Sale" : "Create Flash Sale"}
      </h1>

      {alert && (
        <Alert type={alert.type} message={alert.message} className="mb-4" />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg text-gray-800 font-medium mb-5">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Name"
                className="border rounded-lg text-gray-900"
                {...register("name")}
                error={errors.name?.message}
              />
              <Input
                label="Description"
                className="border rounded-lg text-gray-900"
                {...register("description")}
                error={errors.description?.message}
              />
            </div>
          </div>

          {/* Timing */}
          <div>
            <h2 className="text-lg text-gray-800 font-medium mb-4">
              Sale Period
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <Input
                type="datetime-local"
                label="Start Time"
                className="border rounded-lg text-gray-900"
                {...register("start_time")}
                error={errors.start_time?.message}
              />
              <Input
                type="datetime-local"
                className="border rounded-lg text-gray-900"
                label="End Time"
                {...register("end_time")}
                error={errors.end_time?.message}
              />
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <h2 className="text-lg text-gray-800 font-medium mb-4">Products</h2>

            {/* Product selector */}
            <div className="mb-4">
              <ProductSelect />
            </div>

            {/* Selected products list */}
            <div className="space-y-4">
              {selectedProducts.map((product, index) => (
                <div
                  key={product.product}
                  className="flex items-center border space-x-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{product.product_name}</h3>
                    <div className="text-sm text-gray-600">
                      Original Price:{" "}
                      <PriceDisplay
                        amount={product.original_price}
                        sourceCurrency="USD"
                      />
                    </div>
                  </div>

                  <Input
                    type="number"
                    className="w-32 border rounded-md bg-white text-[0.9rem] md:text-base lg:landscape:text-[0.9rem] text-gray-900"
                    placeholder="Limit"
                    {...register(`products.${index}.quantity_limit` as const, {
                      valueAsNumber: true,
                      max: {
                        value: product.stock,
                        message: "Cannot exceed available stock",
                      },
                    })}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProducts(
                        selectedProducts.filter((_, i) => i !== index)
                      );
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            {errors.products && (
              <p className="mt-2 text-sm text-red-600">
                {errors.products.message}
              </p>
            )}
          </div>

          {/* Discount Settings */}
          <div>
            <h2 className="text-lg text-gray-800 font-medium mb-4">
              Discount Settings
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <DiscountTypeSelect />

              <Input
                type="number"
                label={
                  discountType === "percentage"
                    ? "Discount Percentage"
                    : "Discount Amount"
                }
                className="border rounded-lg text-gray-900"
                {...register("discount_value", { valueAsNumber: true })}
                error={errors.discount_value?.message}
              />
            </div>
          </div>

          {/* Quantity Limits */}
          <div>
            <h2 className="text-lg text-gray-800 font-medium mb-4">
              Quantity Limits
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <Input
                type="number"
                label="Max Quantity Per Customer"
                className="border rounded-lg text-gray-900"
                {...register("max_quantity_per_customer", {
                  valueAsNumber: true,
                })}
                error={errors.max_quantity_per_customer?.message}
              />
              <Input
                type="number"
                label="Total Quantity Limit (Optional)"
                className="border rounded-lg text-gray-900"
                {...register("total_quantity_limit", { valueAsNumber: true })}
                error={errors.total_quantity_limit?.message}
              />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register("is_visible")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-[0.9rem] md:text-base lg:landscape:text-[0.9rem] font-medium text-gray-700">
                Make this flash sale visible to customers
              </span>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/marketing/flash_sale")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-slate-700 hover:bg-slate-700"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            onClick={() => console.log("Button clicked")}
          >
            {isEditing ? "Update Flash Sale" : "Create Flash Sale"}
          </Button>
        </div>
      </form>
    </div>
  );
}
