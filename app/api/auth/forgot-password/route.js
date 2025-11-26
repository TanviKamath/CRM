// /app/api/auth/forgot-password/route.js
import { sendForgotPasswordEmail } from "@/lib/services/passwordResetEmailService";

export async function POST(req) {
  try {
    const body = await req.json();

    const result = await sendForgotPasswordEmail(body);
    return Response.json(result, { status: 200 });
  } catch (err) {
    return new Response(err.message || "Unable to send reset email", {
      status: 400,
    });
  }
}
