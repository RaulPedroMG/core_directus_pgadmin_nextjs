// Development configuration utilities
// Used to suppress specific warnings and configure development behavior

export const DEV_CONFIG = {
  // Suppress specific Next.js warnings in development
  suppressWarnings: {
    // Image optimization warnings
    imageAspectRatio: process.env.NODE_ENV === "development",
    imagePriority: process.env.NODE_ENV === "development",

    // Network warnings
    cors: process.env.NODE_ENV === "development",

    // External resources
    externalImages: process.env.NODE_ENV === "development",
  },

  // Logging configuration
  logging: {
    imageErrors: process.env.NODE_ENV === "development",
    networkErrors: process.env.NODE_ENV === "development",
    authWarnings: process.env.NODE_ENV === "development",
    verbose:
      process.env.NODE_ENV === "development" && process.env.DEBUG === "true",
  },

  // Image fallback configuration
  images: {
    placeholderSrc: "/avatar-placeholder.svg",
    retryAttempts: 2,
    timeoutMs: 5000,

    // Known problematic domains
    problematicDomains: [
      "pbs.twimg.com", // Twitter images often return 404
    ],
  },

  // Console warning suppression for known issues
  suppressConsoleWarnings: () => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      // Store original console methods
      const originalWarn = console.warn;
      const originalError = console.error;

      // Filter specific warnings
      console.warn = (...args) => {
        const message = args.join(" ");

        // Suppress known Next.js Image warnings
        if (
          message.includes("Image with src") &&
          message.includes("has either width or height modified")
        ) {
          return; // Suppress this specific warning
        }

        if (
          message.includes('Please add the "priority" property') &&
          message.includes("LCP")
        ) {
          return; // Suppress LCP priority warning for images we've already optimized
        }

        if (
          message.includes("Image with src") &&
          message.includes("either width or height modified")
        ) {
          return; // Suppress aspect ratio warnings
        }

        if (message.includes("maintain the aspect ratio")) {
          return; // Suppress aspect ratio warnings
        }

        if (message.includes("OptimizedImage.tsx")) {
          return; // Suppress warnings from OptimizedImage component
        }

        if (
          message.includes("width or height modified") &&
          message.includes("techstack.svg")
        ) {
          return; // Suppress specific techstack.svg aspect ratio warning
        }

        if (
          message.includes("techstack.svg") &&
          message.includes("aspect ratio")
        ) {
          return; // Suppress techstack.svg specific warnings
        }

        if (
          message.includes("width or height modified") ||
          message.includes('width: "auto"') ||
          message.includes('height: "auto"')
        ) {
          return; // Suppress all aspect ratio related warnings
        }

        // Call original warn for other messages
        originalWarn.apply(console, args);
      };

      // Filter specific errors (be careful with this)
      console.error = (...args) => {
        const message = args.join(" ");

        // Suppress 404 image errors in development (we handle these gracefully)
        if (message.includes("404") && message.includes("pbs.twimg.com")) {
          return; // Suppress Twitter image 404s
        }

        if (message.includes("404") && message.includes("Not Found")) {
          return; // Suppress all 404 image errors
        }

        if (message.includes("GET https://pbs.twimg.com")) {
          return; // Suppress all Twitter/X image errors
        }

        // Call original error for other messages
        originalError.apply(console, args);
      };

      return () => {
        // Restore original methods if needed
        console.warn = originalWarn;
        console.error = originalError;
      };
    }
  },
};

// Utility function to check if an image URL is likely to fail
export function isProblematicImageUrl(src: string): boolean {
  return DEV_CONFIG.images.problematicDomains.some((domain) =>
    src.includes(domain)
  );
}

// Utility function to get appropriate fallback for different image types
export function getImageFallback(
  originalSrc: string,
  type: "avatar" | "hero" | "general" = "general"
): string {
  switch (type) {
    case "avatar":
      return "/avatar-placeholder.svg";
    case "hero":
      return "/techstack.svg"; // or another hero fallback
    case "general":
    default:
      return DEV_CONFIG.images.placeholderSrc;
  }
}

// Initialize development configuration
export function initDevConfig() {
  if (process.env.NODE_ENV === "development") {
    // Apply console warning suppression
    const cleanup = DEV_CONFIG.suppressConsoleWarnings();

    // Return cleanup function
    return cleanup;
  }
}

// Export for use in _app or layout
export default DEV_CONFIG;
