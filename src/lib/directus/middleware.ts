import { NextRequest, NextResponse } from "next/server";
import { directusAuth } from "./client";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Get token from cookies or authorization header
    const token =
      request.cookies.get("directus_access_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return response;
    }

    // Verify token with Directus
    const authCheck = await directusAuth.isAuthenticated();

    if (authCheck.authenticated) {
      // Token is valid, set/refresh cookies
      response.cookies.set("directus_access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
    } else {
      // Token is invalid, clear cookies
      response.cookies.set("directus_access_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
    }
  } catch (error) {
    console.error("Directus middleware error:", error);
    // Clear cookies on error
    response.cookies.set("directus_access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  }

  return response;
}

export async function createClient() {
  return directusAuth;
}

// Helper function to get user from request
export async function getUser(request: NextRequest) {
  try {
    const token =
      request.cookies.get("directus_access_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return { user: null, error: "No token found" };
    }

    const result = await directusAuth.getCurrentUser();

    if (result.success) {
      return { user: result.data, error: null };
    } else {
      return { user: null, error: result.error };
    }
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}
