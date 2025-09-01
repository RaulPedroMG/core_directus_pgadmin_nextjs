"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

interface SilentImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function SilentImage({
  src,
  alt,
  width = 500,
  height = 500,
  priority = false,
  className = "",
  style = {},
  ...props
}: SilentImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Suppress all warnings for this component
    const originalWarn = console.warn;
    const originalError = console.error;

    const suppressWarning = (...args: any[]) => {
      const message = args.join(" ");

      // Check if the warning is related to this image
      if (
        message.includes(src) ||
        message.includes("aspect ratio") ||
        message.includes("width or height modified") ||
        message.includes("maintain the aspect ratio") ||
        message.includes("Image with src")
      ) {
        return; // Completely suppress
      }

      originalWarn.apply(console, args);
    };

    const suppressError = (...args: any[]) => {
      const message = args.join(" ");

      if (message.includes(src) || message.includes("404")) {
        return; // Suppress image loading errors
      }

      originalError.apply(console, args);
    };

    // Temporarily override console methods
    console.warn = suppressWarning;
    console.error = suppressError;

    // Cleanup on unmount
    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, [src]);

  const handleError = () => {
    // Silently handle errors without logging
  };

  const handleLoad = () => {
    // Silently handle load without logging
  };

  return (
    <div className={className} style={style}>
      <Image
        ref={imageRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
        style={{
          width: "100%",
          height: "auto",
          objectFit: "contain",
        }}
        sizes="(max-width: 768px) 100vw, 50vw"
        {...props}
      />
    </div>
  );
}
