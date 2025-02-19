'use client';

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "../storeUI/ProductCard";
import { Button } from "../UI/Button";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/src/libs/services/customerServices/productService";
import { Footer } from "../storeUI/Footer";

export default function HomePage() {
  // Fetch featured products
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => productService.getFeaturedProducts(),
    staleTime: 5 * 60 * 1000
  });

  return (
    <>
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-curshedAlmond py-24 px-6 sm:py-32">
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Premium Quality Hair Products
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Discover our collection of high-quality wigs, extensions, and hair
              care products.
            </p>
            <div className="mt-10 flex items-center justify-center gap-6">
              <Link href="/shop/products">
                <Button size="lg">
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Featured Products
              </h2>
              <p className="mt-2 text-gray-600">
                Our most popular and trending items
              </p>
            </div>
            <Link href="/products?featured=true">
              <Button variant="outline">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts?.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Preview Section */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Shop by Category
            </h2>
            <p className="mt-2 text-gray-600">
              Find exactly what you&apos;re looking for
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Straight Hair */}
            <Link
              href="/shop/products?category=straight-hair"
              className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 hover:opacity-90"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-semibold text-white">
                  Straight Hair
                </h3>
                <p className="mt-1 text-sm text-gray-200">
                  Sleek and natural-looking straight hair options
                </p>
              </div>
            </Link>

            {/* Curly Hair */}
            <Link
              href="/shop/products?category=curly-hair"
              className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 hover:opacity-90"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-semibold text-white">Curly Hair</h3>
                <p className="mt-1 text-sm text-gray-200">
                  Beautiful and bouncy curly textures
                </p>
              </div>
            </Link>

            {/* Hair Care */}
            <Link
              href="/shop/products?category=hair-care"
              className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 hover:opacity-90"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-semibold text-white">Hair Care</h3>
                <p className="mt-1 text-sm text-gray-200">
                  Essential products for maintaining your hair
                </p>
              </div>
            </Link>
          </div>

          <div className="text-center mt-12">
            <Link href="/categories">
              <Button variant="outline" size="lg">
                View All Categories
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
    <Footer/>
    </>
  );
}
