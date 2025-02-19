import { Metadata } from "next";
import { productService } from "../libs/services/customerServices/productService";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const product = await productService.getProductBySlug(params.slug);

    const title = `${product.name} | Miz Viv Hairs`;
    const description = product.description.replace(/<[^]*>/g, '').slice(0, 160);
    const imageUrl = product.images[0]?.url;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
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
          product.price_data.discount_amount?.toString() || product.price_data.amount.toString(),
        "product:price:currency": "USD",
      },
    };
}