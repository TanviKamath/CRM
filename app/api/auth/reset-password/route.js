// /app/api/auth/reset-password/route.js
import { resetPassword } from "@/lib/services/passwordResetService";

export async function POST(req) {
  try {
    const body = await req.json();
    const result = await resetPassword(body);

    return Response.json(result, { status: 200 });
  } catch (err) {
    return new Response(err.message || "Reset failed", { status: 400 });
  }
}
