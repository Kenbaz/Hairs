import React, { useState } from "react";
import { MoreVertical, Edit, Trash, Star, Share, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AdminProduct } from "@/src/types";
import { PriceDisplay } from "../../UI/PriceDisplay";


interface ProductRowProps {
    product: AdminProduct;
    onEdit: (product: AdminProduct) => void;
    onDelete: (product: AdminProduct) => void;
    onToggleFeatured: (product: AdminProduct) => void;
}


const ProductRow: React.FC<ProductRowProps> = ({
    product,
    onEdit,
    onDelete,
    onToggleFeatured,
}) => {
    const [showActions, setShowActions] = useState(false);


    // const formatPrice = (price: number) => {
    //     return new Intl.NumberFormat('en-US', {
    //         style: 'currency',
    //         currency: 'USD'
    //     }).format(price);
    // };


    const getStockStatus = () => {
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

    const status = getStockStatus();
   
    // Get primary image if it exists
  const primaryImage = product.images?.find(img => img.is_primary);
  const imageUrl =
    primaryImage?.url && primaryImage.url.startsWith("http")
      ? primaryImage.url
      : null;


    return (
      <>
        {/* Product Info */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="h-10 w-10 flex-shrink-0">
              {imageUrl ? (
                <div className="relative h-10 w-10 aspect-square">
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                    className="rounded-full"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
            <div className="ml-4">
              <Link
                href={`/admin/products/${product.id}`}
                className="text-base font-medium text-gray-900 hover:text-blue-600 xl:text-[0.9rem]"
              >
                {product.name}
              </Link>
              {product.is_featured && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-base xl:text-[0.9rem] font-medium bg-yellow-100 text-yellow-800">
                  Featured
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Category */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-base xl:text-[0.9rem] text-gray-600">
            {product.category?.name || "No category"}
          </span>
        </td>

        {/* Price */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-base xl:text-[0.9rem]">
            <div className="font-medium text-gray-900">
              <PriceDisplay
                amount={product.price}
                sourceCurrency="USD"
              />
            </div>
            {product.discount_price && (
              <div className="text-gray-500 line-through">
                <PriceDisplay
                  amount={product.discount_price}
                  sourceCurrency="USD"
                />
              </div>
            )}
          </div>
        </td>

        {/* Stock */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex flex-col">
            <span className="text-base xl:text-[0.9rem] text-gray-900">{product.stock} units</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${status.className}`}
            >
              {status.label}
            </span>
          </div>
        </td>

        {/* Status */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`px-2 py-1 inline-flex text-base xl:text-[0.9rem] leading-5 font-semibold rounded-full ${
              product.is_available
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {product.is_available ? "Active" : "Inactive"}
          </span>
        </td>

        {/* Actions */}
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="text-gray-700 hover:text-gray-600"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {/* Dropdown menu */}
            {showActions && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu">
                  <button
                    onClick={() => {
                      onEdit(product);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-base xl:text-[0.9rem] text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Product
                  </button>
                  <button
                    onClick={() => {
                      onToggleFeatured(product);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-base xl:text-[0.9rem] text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    {product.is_featured ? "Remove Featured" : "Mark Featured"}
                  </button>
                  <button
                    onClick={() => {
                      // Copy product URL to clipboard
                      navigator.clipboard.writeText(
                        `${window.location.origin}/products/${product.slug}`
                      );
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-base xl:text-[0.9rem] text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      onDelete(product);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-base xl:text-[0.9rem] text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </td>
      </>
    );
};


export default ProductRow;