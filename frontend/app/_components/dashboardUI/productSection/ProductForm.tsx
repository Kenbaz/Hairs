import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/_components/UI/Button";
import { Input } from "@/app/_components/UI/Input";
import { Alert } from "@/app/_components/UI/Alert";
import { adminProductService } from "@/src/libs/services/adminProductService";
import type { AdminProduct } from "@/src/types";
import { ImageUpload } from "../../UI/ImageUpload";
import { ApiError } from "next/dist/server/api-utils";
import { AxiosError } from "axios";


// Form validation schema
const productSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1, 'Description is required'),
    category: z.string({
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
    const [images, setImages] = useState<File[]>([]);
    const [imageError, setImageError] = useState<string | null>(null);
    const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    

    const { register, handleSubmit, formState: { errors } } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: product ? {
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
            category: product.category.slug,
        } : {
            is_available: true,
            low_stock_threshold: 5,
        }
    });


    const showAlert = (type: 'success' | 'error', message: string) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 5000);
    };


    const handleImageChange = (files: File[]) => {
      setImages(files);
      setImageError(null);
    };
    

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };


    const mutation = useMutation({
        mutationFn: async (data: ProductFormValues) => {
          const formData = new FormData();

          console.log("Images to upload:", images);

          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              // Convert boolean values to string
              if (typeof value === "boolean") {
                formData.append(key, value ? "true" : "false");
              } else {
                formData.append(key, String(value));
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
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showAlert('success', `Product ${product ? 'updated' : 'created'} successfully`);
            router.push('/admin/products');
        },
        onError: (error) => {
          const err = error as AxiosError<ApiError>;
          
            showAlert('error', `Failed to ${product ? 'update' : 'create'} product`);
            console.error('Product mutation error:', error);
            console.error('Server response:', err.response?.data)
        },
    });

  
    const onSubmit = async (data: ProductFormValues) => {
      try {
        await mutation.mutateAsync(data);
      } catch {
        //
      }
    };


    return (
      <div className="max-w-4xl mx-auto">
        {alert && (
          <Alert type={alert.type} message={alert.message} className="mb-4" />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-medium text-gray-900">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Product Name"
                  {...register("name")}
                  error={errors.name?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  {...register("category")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">Select Category</option>
                  <option value={1}>Straight Hairs</option>
                  <option value={2}>Curly Hairs</option>
                  <option value={3}>Wavy Hairs</option>
                  <option value={4}>Bouncy Hairs</option>
                  <option value={5}>Braiding Extensions</option>
                  <option value={6}>Hair Care Products</option>
                  <option value={7}>Styling Tools</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.category.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
            <h2 className="text-lg font-medium text-gray-900">
              Hair Specific Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Hair Type
                </label>
                <select
                  {...register("hair_type")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">Select Hair Type</option>
                  <option value="raw">Raw Hair</option>
                  <option value="virgin">Virgin Hair</option>
                  <option value="single donor">Single Donor Hair</option>
                </select>
                {errors.hair_type && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.hair_type.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Care Instructions
              </label>
              <textarea
                {...register("care_instructions")}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
            <h2 className="text-lg font-medium text-gray-900">
              Pricing & Inventory
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="number"
                label="Price"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                error={errors.price?.message}
              />

              <Input
                type="number"
                label="Discount Price"
                step="0.01"
                {...register("discount_price", { valueAsNumber: true })}
                error={errors.discount_price?.message}
              />

              <Input
                type="number"
                label="Stock"
                {...register("stock", { valueAsNumber: true })}
                error={errors.stock?.message}
              />
            </div>

            <div>
              <Input
                type="number"
                label="Low Stock Threshold"
                {...register("low_stock_threshold", { valueAsNumber: true })}
                error={errors.low_stock_threshold?.message}
              />
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-medium text-gray-900">
              Product Images
            </h2>
            <ImageUpload
              value={images}
              initialPreviews={product?.images?.map((img) => img.image) || []}
              onChange={handleImageChange}
              onRemove={handleRemoveImage}
              maxFiles={5}
              maxSize={5 * 1024 * 1024} // 5MB
            />
            {imageError && <Alert type="error" message={imageError} />}
          </div>

          {/* Additional Options */}
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="text-lg font-medium text-gray-900">
              Additional Options
            </h2>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register("is_featured")}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Featured Product</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register("is_available")}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  Available for Sale
                </span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/products")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
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
