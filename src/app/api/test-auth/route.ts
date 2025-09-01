import { NextRequest, NextResponse } from "next/server";
import { directusAuth } from "@/lib/directus/client";

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    // Import Directus SDK directly for server-side use
    const { createDirectus, rest, authentication, readMe, readItem } =
      await import("@directus/sdk");

    const directusUrl =
      process.env.DIRECTUS_INTERNAL_URL || "http://directus_shipfree:8055";
    const client = createDirectus(directusUrl)
      .with(rest())
      .with(authentication("json"));

    // Set the token
    client.setToken(token);

    try {
      // Get user with all basic fields
      const user = await client.request(
        readMe({
          fields: ["id", "email", "first_name", "last_name", "status", "role"],
        })
      );

      // Get role information separately if user has a role
      if (user.role && typeof user.role === "string") {
        try {
          const roleId = user.role;
          const roleData = await client.request(
            readItem("directus_roles", roleId, {
              fields: ["id", "name", "description"],
            })
          );

          // Replace role ID with role object
          const isAdmin = roleData.name?.toLowerCase().includes("admin");
          user.role = {
            id: roleData.id,
            name: roleData.name,
            description: roleData.description,
            admin_access: isAdmin,
            app_access: true,
          };
        } catch (roleError) {
          console.warn("Could not fetch role information:", roleError);
        }
      }

      return NextResponse.json({
        success: true,
        user: user,
        message: "User retrieved successfully with server-side code",
      });
    } catch (userError: any) {
      console.error("Error getting user:", userError);
      return NextResponse.json(
        {
          success: false,
          error: userError.message,
          message: "Failed to get user data",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Test auth error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Internal error testing auth",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Import Directus SDK directly for server-side use
    const { createDirectus, rest, authentication, readMe, readItem } =
      await import("@directus/sdk");

    const directusUrl =
      process.env.DIRECTUS_INTERNAL_URL || "http://directus_shipfree:8055";
    const client = createDirectus(directusUrl)
      .with(rest())
      .with(authentication("json", { autoRefresh: false }));

    try {
      // Test login
      const loginResult = await client.login(email, password);

      if (loginResult && loginResult.access_token) {
        // Test getting user after login
        try {
          const user = await client.request(
            readMe({
              fields: [
                "id",
                "email",
                "first_name",
                "last_name",
                "status",
                "role",
              ],
            })
          );

          // Get role information if available
          if (user.role && typeof user.role === "string") {
            try {
              const roleData = await client.request(
                readItem("directus_roles", user.role, {
                  fields: ["id", "name", "description"],
                })
              );

              const isAdmin = roleData.name?.toLowerCase().includes("admin");
              user.role = {
                id: roleData.id,
                name: roleData.name,
                description: roleData.description,
                admin_access: isAdmin,
                app_access: true,
              };
            } catch (roleError) {
              console.warn("Could not fetch role information:", roleError);
            }
          }

          return NextResponse.json({
            success: true,
            login: {
              success: true,
              access_token: loginResult.access_token.substring(0, 50) + "...",
              refresh_token:
                loginResult.refresh_token?.substring(0, 30) + "..." || null,
            },
            user: user,
            message:
              "Full login and user retrieval test completed successfully",
          });
        } catch (userError: any) {
          return NextResponse.json({
            success: false,
            login: { success: true },
            user: null,
            error: userError.message,
            message: "Login succeeded but failed to get user data",
          });
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid login response",
            message: "Login failed - no access token received",
          },
          { status: 401 }
        );
      }
    } catch (loginError: any) {
      console.error("Login error:", loginError);
      return NextResponse.json(
        {
          success: false,
          error: loginError.message,
          message: "Login failed",
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Test login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Internal error testing login",
      },
      { status: 500 }
    );
  }
}
