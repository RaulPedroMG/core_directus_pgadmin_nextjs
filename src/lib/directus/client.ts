import { createDirectus, rest, authentication, readMe } from "@directus/sdk";

// Define the schema for user data from Directus
export interface DirectusUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: {
    id: string;
    name: string;
    description?: string;
    admin_access: boolean;
    app_access: boolean;
  };
  status: string;
}

export interface DirectusSchema {
  directus_users: DirectusUser[];
}

// Create Directus client
const directusUrl =
  process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8070";

let directusClient: any = null;

function getDirectusClient() {
  if (!directusClient) {
    directusClient = createDirectus<DirectusSchema>(directusUrl)
      .with(rest())
      .with(authentication("json", { autoRefresh: true }));

    // Set stored token if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("directus_access_token");
      if (token) {
        directusClient.setToken(token);
      }
    }
  }
  return directusClient;
}

export const directus = getDirectusClient();

// Authentication functions
export const directusAuth = {
  // Login function
  login: async (email: string, password: string) => {
    try {
      const client = getDirectusClient();
      const result = await client.login(email, password);

      // Store token manually for persistence
      if (result && result.access_token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("directus_access_token", result.access_token);
          localStorage.setItem(
            "directus_refresh_token",
            result.refresh_token || ""
          );
        }
      }

      return { success: true, data: result };
    } catch (error: any) {
      console.error("Directus login error:", error);
      return {
        success: false,
        error: error.message || "Login failed",
      };
    }
  },

  // Logout function
  logout: async () => {
    try {
      const client = getDirectusClient();
      await client.logout(); // puede devolver 204 vacío, no es error

      // Clear stored tokens
      if (typeof window !== "undefined") {
        localStorage.removeItem("directus_access_token");
        localStorage.removeItem("directus_refresh_token");
      }

      return { success: true };
    } catch (error: any) {
      console.error("Directus logout error:", {
        message: error?.message,
        response: error?.response,
        stack: error?.stack,
      });

      // Always clear tokens even if server logout fails
      if (typeof window !== "undefined") {
        localStorage.removeItem("directus_access_token");
        localStorage.removeItem("directus_refresh_token");
      }

      return {
        success: false,
        error: error?.message || "Logout failed",
      };
    }
  },

  // Get current user info
  getCurrentUser: async () => {
    try {
      const client = getDirectusClient();

      // Ensure we have a token before making the request
      const token = directusAuth.getToken();
      if (!token) {
        return {
          success: false,
          error: "No authentication token found",
        };
      }

      const user = await client.request(
        readMe({
          fields: [
            "id",
            "email",
            "first_name",
            "last_name",
            "status",
            "role.id",
            "role.name",
            "role.description",
            "role.admin_access",
            "role.app_access",
          ],
        })
      );
      return { success: true, data: user };
    } catch (error: any) {
      console.error("Error getting current user:", error);

      // If token is invalid, clear it
      if (error.status === 401 || error.code === "UNAUTHORIZED") {
        directusAuth.removeToken();
      }

      return {
        success: false,
        error: error.message || "Failed to get user info",
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const token = directusAuth.getToken();
      if (!token) {
        return { success: true, authenticated: false };
      }

      const client = getDirectusClient();
      const user = await client.request(readMe());
      return { success: true, authenticated: !!user };
    } catch (error) {
      // If token is invalid, clear it
      directusAuth.removeToken();
      return { success: true, authenticated: false };
    }
  },

  // Get token from storage (client-side)
  getToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("directus_access_token");
    }
    return null;
  },

  // Set token in storage (client-side)
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("directus_access_token", token);
      const client = getDirectusClient();
      client.setToken(token);
    }
  },

  // Remove token from storage (client-side)
  removeToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("directus_access_token");
      localStorage.removeItem("directus_refresh_token");
      const client = getDirectusClient();
      client.setToken(null);
    }
  },
};
