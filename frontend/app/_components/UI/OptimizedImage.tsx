"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "src" | "alt"> {
  src: string;
  alt: string;
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/",
  className = "",
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  return (
    <Image
      src={error ? fallbackSrc : src}
      alt={alt}
      className={`object-cover ${className}`}
      onError={() => setError(true)}
      {...props}
      loading="lazy"
      quality={75}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
}
