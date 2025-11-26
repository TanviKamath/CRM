import { loginUser } from "../../../lib/services/authService";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const { token, redirectTo } = await loginUser(email, password);

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
    return new Response(e.message || "Login failed", { status: 400 });
  }
}