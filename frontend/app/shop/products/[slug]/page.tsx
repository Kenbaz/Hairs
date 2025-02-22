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
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${
        (
          await params
        ).slug
      }/`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      throw new Error("Product not found");
    }

    const product = await response.json();
    
    const title = `${product.name} | Miz Viv Hairs`;
      const description =
          product.description?.substring(0, 160) || "Premium quality wigs";
      const imageUrl = product.primary_image?.url;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: imageUrl || "",
            width: 800,
            height: 800,
            alt: product.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl || ""],
      },
      other: {
        "product:price:amount":
          product.price_data.discount_amount?.toString() ||
          product.price_data.amount.toString(),
        "product:price:currency": "USD",
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