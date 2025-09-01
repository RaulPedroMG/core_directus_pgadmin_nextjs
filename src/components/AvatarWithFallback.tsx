"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useImageFallback } from "@/hooks/useImageFallback";

interface AvatarWithFallbackProps {
  src: string;
  alt: string;
  fallbackText: string;
  className?: string;
}

export function AvatarWithFallback({
  src,
  alt,
  fallbackText,
  className = "",
}: AvatarWithFallbackProps) {
  const {
    src: currentSrc,
    isError,
    isLoading,
    onError,
    onLoad,
  } = useImageFallback(src, {
    fallbackSrc: "/avatar-placeholder.svg",
  });

  return (
    <Avatar className={className}>
      {!isError && (
        <AvatarImage
          src={currentSrc}
          alt={alt}
          onError={onError}
          onLoad={onLoad}
        />
      )}
      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  );
}
