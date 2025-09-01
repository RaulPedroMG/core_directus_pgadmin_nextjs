"use client";

import { useEffect } from "react";
import { initDevConfig } from "@/utils/dev-config";

interface DevConfigProviderProps {
  children: React.ReactNode;
}

export default function DevConfigProvider({
  children,
}: DevConfigProviderProps) {
  useEffect(() => {
    // Initialize development configuration only in development mode
    if (process.env.NODE_ENV === "development") {
      const cleanup = initDevConfig();

      // Cleanup function to restore console methods if component unmounts
      return cleanup;
    }
  }, []);

  // Suppress all image errors globally
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const originalError = console.error;
      const originalWarn = console.warn;
      const originalLog = console.log;

      // Aggressive suppression of all image-related errors and warnings
      console.error = (...args) => {
        const message = args.join(" ");

        // Suppress image errors completely
        if (
          message.includes("404") ||
          message.includes("Not Found") ||
          message.includes("pbs.twimg.com") ||
          message.includes("Image") ||
          message.includes("GET https://")
        ) {
          return; // Completely suppress
        }

        originalError.apply(console, args);
      };

      console.warn = (...args) => {
        const message = args.join(" ");

        // Suppress all image warnings
        if (
          message.includes("Image with src") ||
          message.includes("aspect ratio") ||
          message.includes("width or height modified") ||
          message.includes("priority") ||
          message.includes("LCP") ||
          message.includes("techstack.svg") ||
          message.includes('width: "auto"') ||
          message.includes('height: "auto"') ||
          message.includes("maintain the aspect ratio") ||
          message.includes("OptimizedImage.tsx") ||
          message.includes("either width or height modified")
        ) {
          return; // Completely suppress
        }

        originalWarn.apply(console, args);
      };

      // Suppress all console.log completely in development
      console.log = () => {
        return; // Suppress all console.log
      };

      return () => {
        console.error = originalError;
        console.warn = originalWarn;
        console.log = originalLog;
      };
    }
  }, []);

  return <>{children}</>;
}
