import { ProductDetailsComp } from "@/app/_components/pages/ProductDetailsComp";
import { Metadata } from "next";
import { use } from "react";


interface ProductDetailsProps { 
    params: Promise<{
        slug: string;
    }>;
}


// Generate meta data for SEO
export async function generateMetadata({
  params,
}: ProductDetailsProps): Promise<Metadata> {
  try {
    // Fetch minimal product data for metadata using fetch API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${(await params).slug}/`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      throw new Error("Product not found");
    }

    const product = await response.json();

    return {
      title: `${product.name} | Miz Viv Hairs`,
      description:
        product.description?.substring(0, 160) ||
        "Premium quality hair product", // Truncate description for meta tag
      openGraph: {
        title: product.name,
        description:
          product.description?.substring(0, 160) ||
          "Premium quality hair product",
        images: [product.primary_image?.url || "/placeholder.png"],
      },
    };
  } catch {
    return {
      title: "Product Not Found | Miz Viv Hairs",
      description: "The requested product could not be found.",
    };
  }
};


export default function ProductDetails({ params }: ProductDetailsProps) {
    const { slug } = use(params);
    return <ProductDetailsComp slug={slug} />
}