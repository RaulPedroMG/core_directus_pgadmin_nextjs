"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

interface SmartAvatarProps {
  src: string;
  alt: string;
  fallbackText: string;
  className?: string;
}

export function SmartAvatar({
  src,
  alt,
  fallbackText,
  className = "",
}: SmartAvatarProps) {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Reset status when src changes
    setImageStatus('loading');
    setShowFallback(false);

    // Pre-load image to check if it exists
    const img = new Image();

    img.onload = () => {
      setImageStatus('loaded');
      setShowFallback(false);
    };

    img.onerror = () => {
      setImageStatus('error');
      setShowFallback(true);
    };

    // Set timeout to avoid hanging
    const timeout = setTimeout(() => {
      if (imageStatus === 'loading') {
        setImageStatus('error');
        setShowFallback(true);
      }
    }, 3000);

    img.src = src;

    return () => {
      clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
    };
  }, [src, imageStatus]);

  return (
    <Avatar className={className}>
      {imageStatus === 'loaded' && !showFallback && (
        <AvatarImage
          src={src}
          alt={alt}
          onError={() => {
            setImageStatus('error');
            setShowFallback(true);
          }}
        />
      )}
      {showFallback && (
        <AvatarImage
          src="/avatar-placeholder.svg"
          alt={`${alt} placeholder`}
        />
      )}
      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  );
}
