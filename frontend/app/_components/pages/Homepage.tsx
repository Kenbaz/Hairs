"use client";

import Link from "next/link";
import FadeInSection from "../UI/FadeInSection";
import { ProductCard } from "../storeUI/ProductCard";
import { Button } from "../UI/Button";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/src/libs/services/customerServices/productService";
import Image from "next/image";
import { StoreProduct } from "@/src/types";


// Define your CDN image URLs
const HERO_IMAGE_1 =
  "https://res.cloudinary.com/dxgp5h8qw/image/upload/v1741483223/products/v0vczzeaj2kkaki212ha.jpg";
const HERO_IMAGE_2 =
  "https://res.cloudinary.com/dxgp5h8qw/image/upload/v1741483222/products/bwaltmdn3h9svijbbmrh.jpg";
const HERO_IMAGE_3 =
  "https://res.cloudinary.com/dxgp5h8qw/image/upload/v1741483550/products/wgu59gd2s1v1qf6nljce.jpg";


export default function HomePage() {
  // Fetch featured products
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => productService.getFeaturedProducts(),
    staleTime: 5 * 60 * 1000,
  });


  return (
    <>
      <div className="flex flex-col min-h-screen mt-[8rem] sm:mt-[4rem]">
        {/* Hero Section */}
        <section
          className="relative bg-cover h-[25rem] sm:h-[60vh] lg:landscape:h-[100vh] py-24 px-6 sm:py-32 overflow-hidden bg-customBlack"
          style={{
            backgroundImage: "url('/hero-background3.svg')",
            backgroundColor: "#fdfcfd"
          }}
        >
          {/* Hero image content remains the same */}
          <div className="absolute z-20 h-[20rem] sm:h-[57vh] lg:landscape:h-[90vh] w-[40%] sm:w-[45%] flex-shrink-0 overflow-hidden m-auto inset-0 top-[25%] sm:top-[10%]">
            <Image
              src={HERO_IMAGE_1}
              alt="hero-image"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-t-3xl"
            />
          </div>
          <div className="absolute z-10 h-[15rem] sm:h-[40vh] lg:landscape:h-[75vh] w-[40%] flex-shrink-0 overflow-hidden rounded-t-md -left-8 sm:-left-14 lg:landscape:left-[4%] lg:landscape:w-[30%] top-5">
            <Image
              src={HERO_IMAGE_2}
              alt="hero-image"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-3xl"
            />
          </div>
          <div className="absolute z-10 h-[15rem] sm:h-[30vh] lg:landscape:h-[50vh] w-[40%] flex-shrink-0 overflow-hidden rounded-t-md -right-5 -bottom-10 sm:-bottom-3">
            <Image
              src={HERO_IMAGE_3}
              alt="hero-image"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-3xl"
            />
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16 px-4 sm:px-[5%] xl:px-[7%] 2xl:px-[15%] bg-customWhite">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-medium text-gray-900">
                  Top Picks
                </h2>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 gap-y-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-square rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 gap-y-5">
                {featuredProducts?.slice(0, 8).map((product: StoreProduct) => (
                  <FadeInSection key={product.id} className="w-full">
                    <ProductCard product={product} />
                  </FadeInSection>
                ))}
              </div>
            )}
          </div>
          <div className="mt-14 flex justify-center">
            <Link href="/shop/products">
              <Button
                variant="default"
                size="lg"
                className="rounded-none bg-customBlack text-white"
              >
                View All
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
