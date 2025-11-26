// app/api/auth/verification/resend/route.js

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { findUserById } from "@/lib/queries/userQueries";
import { resendVerificationEmail } from "@/lib/services/emailVerificationService";

export async function POST() {
  try {
    const token = cookies().get("token")?.value;
    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return new Response("Invalid or expired token", { status: 401 });
    }

    const user = await findUserById(decoded.id);
    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    if (user.email_verified_at) {
      return new Response("Email already verified", { status: 400 });
    }

    const result = await resendVerificationEmail(user);
    return Response.json(result, { status: 200 });

  } catch (err) {
    return new Response(err.message || "Could not resend verification email", {
      status: 400,
    });
  }
}
