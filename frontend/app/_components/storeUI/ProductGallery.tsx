"use client";

import { useState } from "react";
import { OptimizedImage } from "../UI/OptimizedImage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "@/src/types";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useMediaQuery } from "@/src/libs/customHooks/useMediaQuery";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [direction, setDirection] = useState(0);

  // Check if the screen is mobile using a custom hook
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleImageChange = (index: number) => {
    setSelectedImage(index);
    setIsZoomed(false);
  };

  const handleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const handlePrevious = () => {
    setDirection(-1);
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsZoomed(false);
  };

  const handleNext = () => {
    setDirection(1);
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  };

  // Handle drag/swipe gestures
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (isZoomed) return; //  Don't allow swipe when zoomed

    // Determine swipe direction (threshold of 50px)
    if (info.offset.x > 50) {
      handlePrevious();
    } else if (info.offset.x < -50) {
      handleNext();
    }
  };

  // Variants for the slide animation
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 1,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 1,
    }),
  };

  if (!images.length) {
    return (
      <div className="aspect-square w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square w-full overflow-hidden">
        <motion.div
          className="relative w-full h-full"
          drag={isMobile ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={selectedImage}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className={`absolute top-0 left-0 w-full h-full cursor-zoom-in`}
              onClick={handleZoom}
            >
              <div
                className={`relative w-full h-full transition-transform duration-300 ${
                  isZoomed ? "scale-150" : "scale-100"
                }`}
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
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Navigation Arrows - Hidden on Mobile */}
        {images.length > 1 && !isMobile && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow-lg hover:bg-white transition-colors z-10 hover:text-gray-900"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow-lg hover:bg-white transition-colors z-10 hover:text-gray-900"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Mobile Swipe Indicator */}
        {isMobile && images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
            {images.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  selectedImage === index ? "w-4 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleImageChange(index)}
              className={`relative aspect-square overflow-hidden border-2 transition-colors ${
                selectedImage === index
                  ? "border-gray-900"
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
}
