'use client';


import {useState} from 'react'
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Edit, Star, Package, X, UploadCloud } from "lucide-react";
import Image from "next/image";
import { Button } from "../../UI/Button";
import { Alert } from "../../UI/Alert";
import { ImageUpload } from "../../UI/ImageUpload";
import { ConfirmModal } from "../../UI/ConfirmModal";
import { adminProductService } from "@/src/libs/services/adminServices/adminProductService";
import axios from 'axios';
import {PriceDisplay} from '../../UI/PriceDisplay';
import { ProductImage } from '@/src/types';


export default function ProductDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const productId = Number(params.id);


    const [showImageUpload, setShowImageUpload] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    // const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<number | null>(null);
    const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);


    const { data: product, isLoading, error } = useQuery({
        queryKey: ['products', productId],
        queryFn: () => adminProductService.getProduct(productId),
    });


    // Mutation for adding images
    const addImageMutation = useMutation({
      mutationFn: async (files: File[]) => {
        const formData = new FormData();

        // Append each file with the same field name
        files.forEach((file) => {
          formData.append("product_images", file);
        });

        return await adminProductService.uploadAdditionalImages(
          productId,
          files
        );
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["products", productId] });
        setShowImageUpload(false);
        setSelectedImages([]);
        showAlert("success", "Images uploaded successfully");
      },
      onError: () => {
        showAlert("error", "Failed to upload images");
      },
    });


    // Mutation for deleting images
    const deleteImageMutation = useMutation({
      mutationFn: async (imageId: number) => {
        try {
          const response = await adminProductService.deleteProductImage(productId, [imageId])
          return response;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            throw new Error(
              error.response?.data?.error || "Failed to delete image"
            );
          }
          throw error;
        }
        
      },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', productId] });
            showAlert('success', 'Image deleted successfully');
        },
        onError: () => {
            showAlert('error', 'Failed to delete image');
        }
        
    });


    // Mutation for setting primary image
    const setPrimaryImageMutation = useMutation({
      mutationFn: async (imageId: number) => {
        try {
          return await adminProductService.setPrimaryImage(productId, imageId);
        } catch (error) {
          console.error("Error setting primary image:", error);
          throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["products", productId] });
        showAlert("success", "Primary image updated");
      },
      onError: (error) => {
        console.error("Mutation error:", error);
        showAlert("error", "Failed to update primary image");
      },
    });


    const showAlert = (type: 'success' | 'error', message: string) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 5000);
    };


    const handleImageChange = (files: File[]) => {
      console.log("Files selected:", files);
        setSelectedImages(files);
    }
    
  
//     const handleUpload = async () => {
//     if (selectedImages.length === 0) return;

//     try {
//         await addImageMutation.mutateAsync(selectedImages);
//         setSelectedImages([]); // Clear selected images after successful upload
//         setShowImageUpload(false); // Hide upload form
//         showAlert('success', 'Images uploaded successfully');
//     } catch (error) {
//         console.error('Upload failed:', error);
//         showAlert('error', 'Failed to upload images');
//     }
// };


    const handleDeleteImage = (imageId: number) => {
        setImageToDelete(imageId);
        setDeleteModalOpen(true);
    };


    const confirmDeleteImage = async () => {
        if (imageToDelete) {
            await deleteImageMutation.mutateAsync(imageToDelete);
            setDeleteModalOpen(false);
            setImageToDelete(null);
        }
    };


    const handleSetPrimaryImage = async (imageId: number) => {
        try {
          await setPrimaryImageMutation.mutateAsync(imageId);
        } catch (error) {
          console.error("handleSetPrimary error:", error);
        }
    };


    const getStockStatus = () => {
        if (!product) return null;

        if (product.stock <= 0) {
            return {
                label: 'Out of stock',
                className: 'bg-red-100 text-red-800'
            };
        }
        if (product.stock <= product.low_stock_threshold) {
            return {
                label: 'Low Stock',
                className: 'bg-yellow-100 text-yellow-800'
            };
        }
        return {
            label: 'In Stock',
            className: 'bg-green-100 text-green-800'
        };
    };

  
  const getImageUrl = (image: ProductImage | undefined): string | null => { 
    if (!image?.url) return null;

    // Handle Cloudinary Urls
    if (image.url.includes('cloudinary.com')) {
      return image.url;
    };
    return null;
  }


    if (isLoading) {
        return (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
          </div>
        );
    };


    if (error || !product) {
        return (
          <div className="p-4">
            <Alert type="error" message="Failed to load product details" />
          </div>
        );
    };


    const status = getStockStatus();


    return (
      <div className="space-y-6 pb-[10%] md:pb-0">
        {/* Header */}
        {alert && (
          <Alert type={alert.type} message={alert.message} className="mb-4" />
        )}
        {/* Actions Bar */}
        <div className="flex items-center justify-between px-4">
          <Button
            onClick={() => router.back()}
            className="border border-slate-700 bg-slate-700 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="space-x-2">
            <Button
              className="border border-slate-700 bg-slate-700 hover:bg-slate-800"
              onClick={() => router.push(`/admin/products/${product.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {/* Basic Info */}
            <div className="flex items-start space-x-6">
              <div className="w-32 h-32 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {product.images && product.images.length > 0 ? (
                  (() => {
                    const primaryImage =
                      product.images.find((img) => img.is_primary) ||
                      product.images[0];
                    const imageUrl = getImageUrl(primaryImage);

                    if (!imageUrl) {
                      return (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      );
                    }

                    return (
                      <Image
                        src={imageUrl}
                        alt={product.name || "Product image"}
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: "cover" }}
                        className="rounded-lg"
                      />
                    );
                  })()
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {product.name}
                  </h1>
                  {product.is_featured && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <Star className="h-4 w-4 mr-1" />
                      Featured
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-4">
                  <div>
                    <p className="text-base text-gray-900">Category</p>
                    <p className="font-medium text-gray-500">{product.category.name}</p>
                  </div>

                  <div className="flex space-x-[10%]">
                    <div>
                      <p className="text-base text-gray-900">Price</p>
                      <p className="font-medium">
                        <PriceDisplay
                          amount={product.price}
                          className='text-gray-500'
                          sourceCurrency="USD"
                        />
                      </p>
                      {product.discount_price && (
                        <p className="text-sm text-gray-500 line-through">
                          <PriceDisplay
                            amount={product.discount_price}
                            sourceCurrency="USD"
                          />
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-base text-gray-900">Stock</p>
                      <div className="flex items-center">
                        <p className="font-medium text-gray-500">{product.stock} units</p>
                        {status && (
                          <span
                            className={`px-2 hidden md:inline-block py-1 relative bottom-[0.6rem] rounded-full text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Description
                </h3>
                <p className="text-gray-600 text-base whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Specifications
                </h3>
                <dl className="divide-y divide-gray-200">
                  {product.hair_type && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-base font-medium text-gray-500">
                        Hair Type
                      </dt>
                      <dd className="text-base text-gray-900">
                        {product.hair_type}
                      </dd>
                    </div>
                  )}
                  {product.length && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-base font-medium text-gray-500">
                        Length
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {product.length} inches
                      </dd>
                    </div>
                  )}
                  <div className="py-3 flex justify-between">
                    <dt className="text-base font-medium text-gray-500">
                      Low Stock Alert
                    </dt>
                    <dd className="text-base text-gray-900">
                      {product.low_stock_threshold} units
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-base font-medium text-gray-500">
                      Status
                    </dt>
                    <dd className="text-base text-gray-900">
                      {product.is_available ? "Active" : "Inactive"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Product Images Gallery */}
            <div className="bg-white border mt-[2%] rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg flex-1 font-medium text-gray-900">
                    Product Images
                  </h3>
                  <Button
                    variant='outline'
                    onClick={() => setShowImageUpload(!showImageUpload)}
                  >
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Add Images
                  </Button>
                </div>

                {showImageUpload && (
                  <div className="mb-6">
                    <ImageUpload
                      value={selectedImages}
                      onChange={handleImageChange}
                      onRemove={(index) => {
                        setSelectedImages((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
                      maxFiles={5}
                      maxSize={5 * 1024 * 1024}
                    />
                    {selectedImages.length > 0 && (
                      <div className="mt-4 flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedImages([]);
                            setShowImageUpload(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant='outline'
                          onClick={() =>
                            addImageMutation.mutateAsync(selectedImages)
                          }
                          isLoading={addImageMutation.isPending}
                        >
                          Upload Images
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {product?.images && product.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.images.map((image) => {
                      const imageUrl = getImageUrl(image);

                      if (!imageUrl) return null;

                      return (
                        <div
                          key={image.id}
                          className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
                        >
                          <Image
                            src={imageUrl}
                            alt={`${product.name || "Product"} image`}
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                          {/* Image Actions Overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleSetPrimaryImage(image.id)}
                              className={`p-1.5 rounded-full ${
                                image.is_primary
                                  ? "bg-yellow-500 text-white"
                                  : "bg-white text-gray-700 hover:bg-yellow-500 hover:text-white"
                              }`}
                              title={
                                image.is_primary
                                  ? "Primary Image"
                                  : "Set as Primary"
                              }
                            >
                              <Star className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteImage(image.id)}
                              className="p-1.5 bg-white rounded-full text-red-500 hover:bg-red-500 hover:text-white"
                              title="Delete Image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          {image.is_primary && (
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Primary
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      No images uploaded yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Care Instructions */}
            {product.care_instructions && (
              <div className="mt-8 pb-[10%] md:pb-[7%]">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Care Instructions
                </h3>
                <p className="text-gray-600 text-base whitespace-pre-wrap">
                  {product.care_instructions}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setImageToDelete(null);
          }}
          onConfirm={confirmDeleteImage}
          title="Delete Image"
          message="Are you sure you want to delete this image? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    );
}