"use client";

import Image from "next/image";
import { useState } from "react";

interface TechStackImageProps {
  className?: string;
  alt?: string;
}

export default function TechStackImage({
  className = "w-full max-w-md lg:max-w-full",
  alt = "Tech Stack",
}: TechStackImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
  };

  const handleLoad = () => {
    setHasError(false);
  };

  if (hasError) {
    // Fallback SVG content if the image fails to load
    return (
      <div
        className={`${className} flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg`}
        style={{
          aspectRatio: "1/1",
          minHeight: "200px",
        }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🚀</div>
          <div className="text-sm font-semibold">Tech Stack</div>
        </div>
      </div>
    );
  }

  return (
    <Image
      src="/techstack.svg"
      alt={alt}
      width={1126}
      height={1099}
      priority
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{
        width: "100%",
        height: "auto",
      }}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
