"use client";

import { useState, useCallback } from "react";

interface UseImageFallbackOptions {
  fallbackSrc?: string;
  onError?: (error: Event) => void;
  onLoad?: (event: Event) => void;
}

interface UseImageFallbackReturn {
  src: string;
  isError: boolean;
  isLoading: boolean;
  onError: (event: Event) => void;
  onLoad: (event: Event) => void;
  retry: () => void;
}

export function useImageFallback(
  originalSrc: string,
  options: UseImageFallbackOptions = {}
): UseImageFallbackReturn {
  const {
    fallbackSrc = "/avatar-placeholder.svg",
    onError: onErrorCallback,
    onLoad: onLoadCallback,
  } = options;

  const [currentSrc, setCurrentSrc] = useState(originalSrc);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFallbackFailed, setHasFallbackFailed] = useState(false);

  const handleError = useCallback(
    (event: Event) => {
      if (currentSrc === originalSrc && !hasFallbackFailed) {
        // First failure - try fallback
        setCurrentSrc(fallbackSrc);
        setIsError(false);
      } else if (currentSrc === fallbackSrc) {
        // Fallback also failed
        setHasFallbackFailed(true);
        setIsError(true);
      } else {
        // Both original and fallback failed
        setIsError(true);
      }

      setIsLoading(false);
      onErrorCallback?.(event);
    },
    [currentSrc, originalSrc, fallbackSrc, hasFallbackFailed, onErrorCallback]
  );

  const handleLoad = useCallback(
    (event: Event) => {
      setIsLoading(false);
      setIsError(false);
      onLoadCallback?.(event);
    },
    [onLoadCallback]
  );

  const retry = useCallback(() => {
    setCurrentSrc(originalSrc);
    setIsError(false);
    setIsLoading(true);
    setHasFallbackFailed(false);
  }, [originalSrc]);

  return {
    src: currentSrc,
    isError,
    isLoading,
    onError: handleError,
    onLoad: handleLoad,
    retry,
  };
}

// Hook específico para avatares con configuración predeterminada
export function useAvatarFallback(src: string) {
  return useImageFallback(src, {
    fallbackSrc: "/avatar-placeholder.svg",
  });
}

// Hook para validar URLs de imagen antes de cargarlas
export function useImageValidator() {
  const [validatedUrls, setValidatedUrls] = useState<Set<string>>(new Set());
  const [invalidUrls, setInvalidUrls] = useState<Set<string>>(new Set());

  const validateImage = useCallback(
    (src: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (validatedUrls.has(src)) {
          resolve(true);
          return;
        }

        if (invalidUrls.has(src)) {
          resolve(false);
          return;
        }

        const img = new Image();

        img.onload = () => {
          setValidatedUrls((prev) => new Set([...prev, src]));
          resolve(true);
        };

        img.onerror = () => {
          setInvalidUrls((prev) => new Set([...prev, src]));
          resolve(false);
        };

        // Set timeout to avoid hanging
        setTimeout(() => {
          if (!validatedUrls.has(src) && !invalidUrls.has(src)) {
            setInvalidUrls((prev) => new Set([...prev, src]));
            resolve(false);
          }
        }, 5000);

        img.src = src;
      });
    },
    [validatedUrls, invalidUrls]
  );

  const isValid = useCallback(
    (src: string): boolean | undefined => {
      if (validatedUrls.has(src)) return true;
      if (invalidUrls.has(src)) return false;
      return undefined; // Unknown
    },
    [validatedUrls, invalidUrls]
  );

  const clearCache = useCallback(() => {
    setValidatedUrls(new Set());
    setInvalidUrls(new Set());
  }, []);

  return {
    validateImage,
    isValid,
    clearCache,
    validatedUrls: Array.from(validatedUrls),
    invalidUrls: Array.from(invalidUrls),
  };
}
