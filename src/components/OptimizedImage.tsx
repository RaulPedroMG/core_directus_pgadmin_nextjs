"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "onError" | "onLoad"> {
  fallbackSrc?: string;
  suppressErrors?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fallbackSrc = "/avatar-placeholder.svg",
  suppressErrors = true,
  className,
  style,
  ...props
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (suppressErrors && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setHasError(false);
  };

  // Prevent aspect ratio warnings by letting Next.js handle dimensions
  const imageStyle = {
    ...style,
  };

  if (hasError && currentSrc === fallbackSrc) {
    // If both original and fallback failed, show a colored div
    return (
      <div
        className={`bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ${className || ""}`}
        style={{
          width: "100%",
          height: "auto",
          aspectRatio: "1/1",
          minWidth: "40px",
          minHeight: "40px",
          ...style,
        }}
      >
        <span className="text-white text-xs font-semibold">
          {alt ? alt.charAt(0).toUpperCase() : "IMG"}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
}
