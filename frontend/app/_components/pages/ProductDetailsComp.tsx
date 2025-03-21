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
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-10 lg:px-[5%] py-8 mt-[5rem] sm:mt-[4rem]">
        <div className="grid sm:grid-cols-2 sm:gap-10">
          {/* Product Gallery */}
          <div>
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Product Info */}
          <div className="mt-8 sm:mt-0">
            {/* Category & Name */}
            <div className="mb-6">
              <h3 className="text-sm tracking-[0.02em] text-gray-500 mb-1">
                Miz Viv Luxury Hair
              </h3>
              <h1 className="text-[1.6rem] tracking-[0.02em] font-semibold text-gray-900">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="mb-6">
              {hasDiscount ? (
                <div>
                  <PriceDisplay
                    amount={discountPrice}
                    sourceCurrency="USD"
                    className="text-xl tracking-[0.02em] font-medium text-gray-900"
                  />
                  <div className="flex items-center gap-2">
                    <PriceDisplay
                      amount={originalPrice}
                      sourceCurrency="USD"
                      className="text-base tracking-[0.02em] text-gray-600 line-through"
                    />
                    <span className="text-sm text-green-600 font-medium">
                      {savings_percentage} % Off
                    </span>
                  </div>
                </div>
              ) : (
                <PriceDisplay
                  amount={originalPrice}
                  sourceCurrency="USD"
                  className="text-xl tracking-[0.02em] font-medium text-gray-900"
                />
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock > 0 ? (
                product.stock <= (product.low_stock_threshold || 5) ? (
                  <p className="text-gray-600">
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
            <div className=" mb-8">
              <AddToCartButton
                productId={product.id}
                stock={product.stock}
                productData={product}
                className="flex-1"
              />
              <WishlistButton
                productId={product.id}
                className=" bg-customBlack text-white mt-3"
                showText
              />
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none mb-8">
              <div
                dangerouslySetInnerHTML={{ __html: product.description }}
                className="text-gray-700 tracking-wide"
              />
            </div>

            {/* Share & Copy Link */}
            <div>
              <Button
                variant="default"
                className="flex items-center gap-3 -ml-4 text-base mt-3 hover:underline"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
                Share
              </Button>
            </div>

            {/* Care Instructions */}
            {product.care_instructions && (
              <div className="pt-8">
                <h2 className="text-lg tracking-wide text-gray-800 font-semibold mb-2">
                  Care Instructions
                </h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: product.care_instructions,
                  }}
                  className="prose prose-sm max-w-none text-gray-700 tracking-wide"
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
    </>
  );
}