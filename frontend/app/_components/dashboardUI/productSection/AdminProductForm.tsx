import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Button } from "@/app/_components/UI/Button";
import { Input } from "@/app/_components/UI/Input";
import { Alert } from "@/app/_components/UI/Alert";
import { adminProductService } from "@/src/libs/services/adminServices/adminProductService";
import type { AdminProduct, ProductImage } from "@/src/types";
import { ImageUpload } from "../../UI/ImageUpload";
import { ApiError } from "next/dist/server/api-utils";
import { AxiosError } from "axios";
import { Category } from "@/src/types";


// Form validation schema
const productSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1, 'Description is required'),
    category_id: z.number({
        required_error: 'Please select a category',
    }),
    hair_type: z.string().optional(),
    price: z.number().min(0.01, 'Price must be greater than 0'),
    discount_price: z.number().min(0).optional(),
    stock: z.number().min(0, 'Stock cannot be negative'),
    care_instructions: z.string().optional(),
    is_featured: z.boolean().optional(),
    is_available: z.boolean().default(true),
    low_stock_threshold: z.number().min(1, 'Low stock threshold must be at least 1')
});


type ProductFormValues = z.infer<typeof productSchema>;


interface ProductFormProps {
    product?: AdminProduct;
}


export const ProductForm: React.FC<ProductFormProps> = ({ product }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    product ? product.category : null
  );
  const [selectedHairType, setSelectedHairType] = useState(
    product?.hair_type || ""
  );

  // Hair type options
  const hairTypeOptions = [
    { value: "", label: "Select Hair Type" },
    { value: "raw", label: "Raw Hair" },
    { value: "virgin", label: "Virgin Hair" },
    { value: "single donor", label: "Single Donor Hair" },
  ];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          stock: product.stock,
          description: product.description,
          hair_type: product.hair_type || undefined,
          discount_price: product.discount_price || undefined,
          price: product.price,
          care_instructions: product.care_instructions || undefined,
          is_featured: product.is_featured,
          is_available: product.is_available,
          low_stock_threshold: product.low_stock_threshold,
          category_id: product.category.id,
        }
      : {
          is_available: true,
          low_stock_threshold: 5,
        },
  });


  // Update form values when selections change
  useEffect(() => {
    if (selectedCategory) {
      setValue("category_id", selectedCategory.id);
    }
  }, [selectedCategory, setValue]);

  useEffect(() => {
    setValue("hair_type", selectedHairType);
  }, [selectedHairType, setValue]);


  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        // setCategoryError(null);
        const data = await adminProductService.getCategories();
        console.log("Loaded categories:", data); // Debug log
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories:", error);
        // setCategoryError("Failed to load categories");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleImageChange = (files: File[]) => {
    setImages(files);
    setImageError(null);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const formData = new FormData();

      console.log("Form data before processing:", data);

      console.log("Images to upload:", images);

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Special handling for category_id to ensure correct field name
          if (key === "category_id") {
            formData.append("category_id", value.toString());
          } else if (typeof value === "boolean") {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Append images with logging
      images.forEach((image) => {
        formData.append("product_images", image);
      });

      // Generate slug from name
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      formData.append("slug", slug);

      if (product) {
        return adminProductService.updateProduct(product.id, formData);
      }
      return adminProductService.createProduct(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      showAlert(
        "success",
        `Product ${product ? "updated" : "created"} successfully`
      );
      router.push("/admin/products");
    },
    onError: (error) => {
      const err = error as AxiosError<ApiError>;

      showAlert("error", `Failed to ${product ? "update" : "create"} product`);
      console.error("Product mutation error:", error);
      console.error("Server response:", err.response?.data);
    },
  });

  const getImageUrl = (image: ProductImage): string | null => {
    if (!image?.url) return null;

    if (image.url.includes("cloudinary.com")) {
      return image.url;
    }

    return null;
  };

  const getInitialPreviews = (): string[] => {
    if (!product?.images) return [];

    return product.images
      .map((image) => getImageUrl(image))
      .filter((url): url is string => url !== null);
  };

  const onSubmit = (data: ProductFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-4xl min-h-screen pb-[14%] md:pb-[1%] mx-auto">
      {alert && (
        <Alert type={alert.type} message={alert.message} className="mb-4" />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-medium text-black">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Product Name"
                {...register("name")}
                error={errors.name?.message}
                className="rounded-lg border bg-gray-50 text-base text-gray-900"
              />
            </div>

            <div>
              <label className="block text-base font-medium text-black">
                Category
              </label>
              <Listbox
                value={selectedCategory}
                onChange={setSelectedCategory}
                disabled={isLoadingCategories}
              >
                <div className="relative mt-1">
                  <ListboxButton className="relative w-full cursor-default rounded-lg bg-gray-50 py-2 pl-3 pr-10 text-left border focus:outline-none">
                    <span className="block truncate text-gray-900">
                      {selectedCategory?.name || "Select Category"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDown
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </ListboxButton>
                  <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    {categories.map((category) => (
                      <ListboxOption
                        key={category.id}
                        value={category}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-gray-200 text-blue-900"
                              : "text-gray-900"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? "font-medium" : "font-normal"
                              }`}
                            >
                              {category.name}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.category_id.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-800">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className="mt-1 block w-full text-gray-900 px-3 py-2 border rounded-md text-base shadow-sm focus:outline-none"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>

        {/* Hair Specific Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-medium text-black">
            Hair Specific Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-black">
                Hair Type
              </label>
              <Listbox value={selectedHairType} onChange={setSelectedHairType}>
                <div className="relative mt-1">
                  <ListboxButton className="relative w-full cursor-default rounded-lg bg-gray-50 py-2 pl-3 pr-10 text-left border focus:outline-none">
                    <span className="block truncate text-gray-900">
                      {hairTypeOptions.find(
                        (option) => option.value === selectedHairType
                      )?.label || "Select Hair Type"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDown
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </ListboxButton>
                  <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    {hairTypeOptions.map((option) => (
                      <ListboxOption
                        key={option.value}
                        value={option.value}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-gray-200 text-blue-900"
                              : "text-gray-900"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? "font-medium" : "font-normal"
                              }`}
                            >
                              {option.label}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
              {errors.hair_type && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.hair_type.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-black">
              Care Instructions
            </label>
            <textarea
              {...register("care_instructions")}
              rows={4}
              className="mt-1 block w-full border rounded-md text-gray-900 px-3 pt-2 shadow-sm focus:outline-none"
              placeholder="Enter care instructions for the product..."
            />
            {errors.care_instructions && (
              <p className="mt-1 text-sm text-red-600">
                {errors.care_instructions.message}
              </p>
            )}
          </div>
        </div>

        {/* Pricing and Inventory */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-medium text-black">
            Pricing & Inventory
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="number"
              className="text-base text-gray-900 rounded-lg border"
              label="Price"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
              error={errors.price?.message}
            />

            <Input
              type="number"
              label="Discount Price"
              className="text-base text-gray-900 rounded-lg border bg-gray-50"
              step="0.01"
              {...register("discount_price", { valueAsNumber: true })}
              error={errors.discount_price?.message}
            />

            <Input
              type="number"
              label="Stock"
              className="text-base text-gray-900 rounded-lg border bg-gray-50"
              {...register("stock", { valueAsNumber: true })}
              error={errors.stock?.message}
            />
          </div>

          <div>
            <Input
              type="number"
              label="Low Stock Threshold"
              className="text-base text-gray-900 rounded-lg border bg-gray-50"
              {...register("low_stock_threshold", { valueAsNumber: true })}
              error={errors.low_stock_threshold?.message}
            />
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-medium text-black">Product Images</h2>
          <ImageUpload
            value={images}
            initialPreviews={getInitialPreviews()}
            onChange={handleImageChange}
            onRemove={handleRemoveImage}
            maxFiles={5}
            maxSize={5 * 1024 * 1024} // 5MB
          />
          {imageError && <Alert type="error" message={imageError} />}
        </div>

        {/* Additional Options */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-lg font-medium text-black">
            Additional Options
          </h2>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register("is_featured")}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-900">Featured Product</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register("is_available")}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-900">Available for Sale</span>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pr-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-slate-800 hover:bg-slate-900"
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {product ? "Update" : "Create"} Product
          </Button>
        </div>
      </form>
    </div>
  );
}
