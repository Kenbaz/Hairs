import { OptimizedImage } from "../UI/OptimizedImage";
import Link from "next/link";
import { StoreProduct } from "@/src/types";
import { AddToCartButton } from "../cartUI/AddToCartButton";
import { WishlistButton } from "../wishlistUI/WishlistButton";
import { PriceDisplay } from "../UI/PriceDisplay";

interface ProductCardProps {
  product: StoreProduct;
  className?: string;
}

export function ProductCard({ product, className = "" }: ProductCardProps) {
  // Get image URL from primary_image
  const imageUrl = product.primary_image?.url;

  // Get price information from price_data
  const {
    amount: originalPrice,
    discount_amount: discountPrice,
    is_discounted: hasDiscount,
    savings_percentage,
  } = product.price_data;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}
    >
      <Link href={`/shop/products/${product.slug}`} className="group">
        {/* Product Image */}
        <div className="relative aspect-square w-full">
          {imageUrl && (
            <OptimizedImage
              src={imageUrl}
              alt={product.name}
              fill
              className="transition-transform duration-300 group-hover:scale-105"
            />
          )}
          {/* Only show out of stock overlay if stock is 0 */}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Price Display */}
          <div className="mt-2 space-y-1">
            {hasDiscount ? (
              <>
                <PriceDisplay
                  amount={discountPrice}
                  sourceCurrency="USD"
                  className="font-semibold text-lg text-gray-900"
                />
                <PriceDisplay
                  amount={originalPrice}
                  sourceCurrency="USD"
                  className="text-sm text-gray-500 line-through"
                />
                <span className="text-green-600 text-sm ml-2">
                  {savings_percentage}% Off
                </span>
              </>
            ) : (
              <PriceDisplay
                amount={originalPrice}
                sourceCurrency="USD"
                className="font-semibold text-lg text-gray-900"
              />
            )}
          </div>

          {/* Stock Status */}
          {product.stock > 0 && (
            <div className="mt-2">
              {product.stock <= (product.low_stock_threshold || 5) ? (
                <p className="text-sm text-orange-600">
                  Only {product.stock} left in stock
                </p>
              ) : (
                <p className="text-sm text-green-600">In Stock</p>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="p-4 pt-0 flex gap-2">
        <AddToCartButton
          productId={product.id}
          stock={product.stock}
          productData={product}
          showQuantity={false}
          className="flex-1"
        />
        <WishlistButton productId={product.id} />
      </div>
    </div>
  );
}
