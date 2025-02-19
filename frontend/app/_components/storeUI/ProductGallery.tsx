'use client';

import { useState } from "react";
import { OptimizedImage } from "../UI/OptimizedImage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "@/src/types";


interface ProductGalleryProps {
    images: ProductImage[];
    productName: string;
}


export function ProductGallery({ images, productName }: ProductGalleryProps) { 
    const [selectedImage, setSelectedImage] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);


    const handleImageChange = (index: number) => {
        setSelectedImage(index);
        setIsZoomed(false);
    };


    const handleZoom = () => { 
        setIsZoomed(!isZoomed);
    }


    const handlePrevious = () => {
        setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        setIsZoomed(false);
    };


    const handleNext = () => {
        setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        setIsZoomed(false);
    };


    if (!images.length) {
      return (
        <div className="aspect-square w-full bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">No images available</p>
        </div>
      );
    };


    return (
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
          <div
            className={`relative w-full h-full cursor-zoom-in transition-transform duration-300 ${
              isZoomed ? "scale-150" : "scale-100"
            }`}
            onClick={handleZoom}
          >
            <OptimizedImage
              src={images[selectedImage].url}
              alt={`${productName} - Image ${selectedImage + 1}`}
              fill
              className={`${
                isZoomed ? "object-cover" : "object-contain"
              } transition-transform duration-300`}
            />
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow-lg hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow-lg hover:bg-white transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => handleImageChange(index)}
                className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                  selectedImage === index
                    ? "border-blue-600"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <OptimizedImage
                  src={image.url}
                  alt={`${productName} - Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
};