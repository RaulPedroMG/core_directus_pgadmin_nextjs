import { cookies } from "next/headers";
import { directusAuth, DirectusUser } from "./client";

export async function createClient() {
  const cookieStore = await cookies();

  return {
    // Get current authenticated user
    auth: {
      getUser: async () => {
        try {
          const token = cookieStore.get("directus_access_token")?.value;

          if (!token) {
            return { data: { user: null }, error: null };
          }

          // Set token for this request
          if (typeof window === "undefined") {
            directusAuth.setToken(token);
          }

          const result = await directusAuth.getCurrentUser();

          if (result.success) {
            return {
              data: { user: result.data },
              error: null,
            };
          } else {
            return {
              data: { user: null },
              error: { message: result.error },
            };
          }
        } catch (error: any) {
          return {
            data: { user: null },
            error: { message: error.message || "Failed to get user" },
          };
        }
      },

      signInWithPassword: async ({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) => {
        try {
          const result = await directusAuth.login(email, password);

          if (result.success) {
            // Set cookie for subsequent requests
            const token = directusAuth.getToken();
            if (token) {
              cookieStore.set("directus_access_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7, // 7 days
                path: "/",
              });
            }

            // Get user data after login
            const userResult = await directusAuth.getCurrentUser();

            return {
              data: { user: userResult.success ? userResult.data : null },
              error: null,
            };
          } else {
            return {
              data: { user: null },
              error: { message: result.error },
            };
          }
        } catch (error: any) {
          return {
            data: { user: null },
            error: { message: error.message || "Login failed" },
          };
        }
      },

      signUp: async ({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) => {
        // Directus doesn't typically allow public sign-up
        // This would need to be handled through admin or specific permissions
        return {
          data: { user: null },
          error: { message: "Sign up not available. Contact administrator." },
        };
      },

      signOut: async () => {
        try {
          await directusAuth.logout();

          // Clear cookie
          cookieStore.set("directus_access_token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 0,
            path: "/",
          });

          return { error: null };
        } catch (error: any) {
          // Even if server logout fails, clear local cookie
          cookieStore.set("directus_access_token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 0,
            path: "/",
          });

          return { error: { message: error.message || "Logout failed" } };
        }
      },
    },
  };
}

// Helper function for server components
export async function getUser(): Promise<DirectusUser | null> {
  try {
    const client = await createClient();
    const { data } = await client.auth.getUser();
    return data.user as DirectusUser | null;
  } catch (error) {
    console.error("Error getting user in server component:", error);
    return null;
  }
}

// Helper function to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser();
  return user !== null;
}

// Remove problematic export that causes cookies() to be called at module level
// Use createClient() directly in components/pages instead
