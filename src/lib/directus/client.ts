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
// Use different URLs for server-side (inside container) vs client-side
const directusUrl =
  typeof window === "undefined"
    ? process.env.DIRECTUS_INTERNAL_URL || "http://directus_shipfree:8055"
    : process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8070";

let directusClient: any = null;

function getDirectusClient() {
  if (!directusClient) {
    directusClient = createDirectus<DirectusSchema>(directusUrl)
      .with(rest())
      .with(authentication("json", { autoRefresh: true }));

    // Set stored token if available
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("directus_access_token") ||
        getCookieValue("directus_access_token");
      if (token) {
        directusClient.setToken(token);
      }
    }
  }
  return directusClient;
}

// Helper function to get cookie value
function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
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

          // Also set cookie for server-side access
          document.cookie = `directus_access_token=${result.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }
      }

      return { success: true, data: result };
    } catch (error: any) {
      console.error("Directus login error:", error);

      let errorMessage = "Error de inicio de sesión";

      if (error?.response) {
        const status = error.response.status;
        if (status === 401) {
          errorMessage =
            "Credenciales incorrectas. Verifica tu email y contraseña.";
        } else if (status === 403) {
          errorMessage = "Tu cuenta no tiene permisos para acceder.";
        } else if (status === 429) {
          errorMessage =
            "Demasiados intentos. Espera unos minutos e intenta de nuevo.";
        } else if (status >= 500) {
          errorMessage =
            "Error del servidor. Intenta de nuevo en unos minutos.";
        }
      } else if (
        error?.code === "ECONNREFUSED" ||
        error?.message?.includes("fetch")
      ) {
        errorMessage =
          "No se puede conectar al servidor. Verifica que Directus esté funcionando.";
      } else if (
        error?.errors &&
        Array.isArray(error.errors) &&
        error.errors[0]?.message
      ) {
        errorMessage = error.errors[0].message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Logout function
  logout: async () => {
    try {
      const client = getDirectusClient();
      const refreshToken = localStorage.getItem("directus_refresh_token");

      // Try to logout with refresh token if available
      if (refreshToken) {
        try {
          await client.logout(refreshToken);
        } catch (logoutError: any) {
          // If logout fails with 400, it means already logged out or token invalid
          if (logoutError?.response?.status !== 400) {
            console.warn(
              "Server logout failed, continuing with local cleanup:",
              logoutError
            );
          }
        }
      }

      // Always clean up local storage regardless of server response
      if (typeof window !== "undefined") {
        localStorage.removeItem("directus_access_token");
        localStorage.removeItem("directus_refresh_token");
        document.cookie =
          "directus_access_token=; path=/; max-age=0; SameSite=Lax";
      }

      return { success: true };
    } catch (error: any) {
      console.error("Directus logout error:", error);
      // Always clean up local storage even if there's an error
      if (typeof window !== "undefined") {
        localStorage.removeItem("directus_access_token");
        localStorage.removeItem("directus_refresh_token");
        document.cookie =
          "directus_access_token=; path=/; max-age=0; SameSite=Lax";
      }
      return {
        success: true, // Still return success since we cleaned up locally
        warning: "Server logout failed but local cleanup succeeded",
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

      // Get user with role information directly in the readMe call
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
          ],
        })
      );

      // Process role information if available
      if (user.role && typeof user.role === "object") {
        // Infer permissions based on role name since admin_access/app_access are restricted
        const isAdmin =
          user.role.name?.toLowerCase().includes("admin") || false;
        user.role = {
          ...user.role,
          admin_access: isAdmin,
          app_access: true, // Most roles have app access
        };
      }
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
      return (
        localStorage.getItem("directus_access_token") ||
        getCookieValue("directus_access_token")
      );
    }
    return null;
  },

  // Set token in storage (client-side)
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("directus_access_token", token);
      document.cookie = `directus_access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      const client = getDirectusClient();
      client.setToken(token);
    }
  },

  // Remove token from storage (client-side)
  removeToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("directus_access_token");
      localStorage.removeItem("directus_refresh_token");
      document.cookie =
        "directus_access_token=; path=/; max-age=0; SameSite=Lax";
      const client = getDirectusClient();
      client.setToken(null);
    }
  },

  // Supabase-compatible API methods
  auth: {
    getUser: async () => {
      const result = await directusAuth.getCurrentUser();
      if (result.success) {
        return { data: { user: result.data }, error: null };
      } else {
        return { data: { user: null }, error: { message: result.error } };
      }
    },

    signInWithPassword: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const result = await directusAuth.login(email, password);
      if (result.success) {
        const userResult = await directusAuth.getCurrentUser();
        return {
          data: { user: userResult.success ? userResult.data : null },
          error: null,
        };
      } else {
        return { data: { user: null }, error: { message: result.error } };
      }
    },

    signOut: async () => {
      const result = await directusAuth.logout();
      return result.success
        ? { error: null }
        : { error: { message: result.error } };
    },
  },
};
