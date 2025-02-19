'use client';

import { useProductDetailQuery } from "@/src/libs/customHooks/useProductDetails";
import { ProductGallery } from "../storeUI/ProductGallery";
import { AddToCartButton } from "../cartUI/AddToCartButton";
import { WishlistButton } from "../wishlistUI/WishlistButton";
import { PriceDisplay } from "../UI/PriceDisplay";
import { Button } from "../UI/Button";
import { Share2, Loader2 } from "lucide-react";
import { showToast } from "../_providers/ToastProvider";
import { ReviewsSection } from "../storeUI/ProductReviews";
import { RelatedProducts } from "../storeUI/RelatedProductsComp";


interface ProductDetailsCompProps { 
    slug: string;
}


export function ProductDetailsComp({ slug }: ProductDetailsCompProps) {
  const { product, isLoading } = useProductDetailQuery(slug);

  const handleShare = async () => {
    if (typeof navigator.share !== "undefined") {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast.success("Link copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Product Not Found</h1>
        <p className="mt-2 text-gray-500">
          This product may have been removed or is no longer available.
        </p>
      </div>
    );
  }

  // Get price information from price_data
  const {
    amount: originalPrice,
    discount_amount: discountPrice,
    is_discounted: hasDiscount,
    savings_percentage,
  } = product.price_data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="lg:grid lg:grid-cols-2 lg:gap-12">
        {/* Product Gallery */}
        <div>
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Product Info */}
        <div className="mt-8 lg:mt-0">
          {/* Category & Name */}
          <div className="mb-6">
            <h3 className="text-sm text-gray-500 mb-1">
              {product.category.name}
            </h3>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          </div>

          {/* Price */}
          <div className="mb-6">
            {hasDiscount ? (
              <div className="space-y-1">
                <PriceDisplay
                  amount={discountPrice}
                  sourceCurrency="USD"
                  className="text-3xl font-bold text-gray-900"
                />
                <div className="flex items-center gap-2">
                  <PriceDisplay
                    amount={originalPrice}
                    sourceCurrency="USD"
                    className="text-lg text-gray-500 line-through"
                  />
                  <span className="text-green-600 font-medium">
                    {savings_percentage} % Off
                  </span>
                </div>
              </div>
            ) : (
              <PriceDisplay
                amount={originalPrice}
                sourceCurrency="USD"
                className="text-3xl font-bold text-gray-900"
              />
            )}
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            {product.stock > 0 ? (
              product.stock <= (product.low_stock_threshold || 5) ? (
                <p className="text-orange-600">
                  Only {product.stock} left in stock - order soon
                </p>
              ) : (
                <p className="text-green-600">In Stock</p>
              )
            ) : (
              <p className="text-red-600">Out of Stock</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <AddToCartButton
              productId={product.id}
              stock={product.stock}
              className="flex-1"
            />
            <WishlistButton productId={product.id} showText />
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none mb-8">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <div
              dangerouslySetInnerHTML={{ __html: product.description }}
              className="text-gray-600"
            />
          </div>

          {/* Specifications */}
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold mb-4">Specifications</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {product.hair_type && (
                <>
                  <dt className="text-sm font-medium text-gray-500">
                    Hair Type
                  </dt>
                  <dd className="text-sm text-gray-900">{product.hair_type}</dd>
                </>
              )}
            </dl>
          </div>

          {/* Care Instructions */}
          {product.care_instructions && (
            <div className="border-t pt-8">
              <h2 className="text-lg font-semibold mb-2">Care Instructions</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: product.care_instructions,
                }}
                className="prose prose-sm max-w-none text-gray-600"
              />
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <ReviewsSection productId={product.id} />

      {/* Related Products */}
      <RelatedProducts
        currentProductId={product.id}
        categoryId={product.category.id}
      />
    </div>
  );
}