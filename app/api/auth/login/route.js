import { loginUser } from "../../../lib/services/authService";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Login request body:", body);
    const { email, password } = body;

    if (!email || !password) {
      console.log("Missing email or password");
      return new Response("Missing email or password", { status: 400 });
    }

    console.log("Attempting login for:", email);
    const { token, redirectTo } = await loginUser(email, password);
    console.log("Login successful, token generated");

    // Save cookie
    cookies().set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "lax",
    });

    return Response.json({ redirectTo }, { status: 200 });
  } catch (e) {
    console.error("Login error:", e.message);
    return new Response(e.message || "Login failed", { status: 400 });
  }
}