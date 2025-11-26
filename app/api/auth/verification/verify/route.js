// app/api/auth/verification/verify/route.js

import { verifyEmail } from "@/lib/services/emailVerificationService";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const params = {
      id: searchParams.get("id"),
      expires: searchParams.get("expires"),
      signature: searchParams.get("signature"),
    };

    if (!params.id || !params.expires || !params.signature) {
      return new Response("Invalid verification link", { status: 400 });
    }

    const { redirectTo } = await verifyEmail(params);

    return Response.redirect(redirectTo);

  } catch (e) {
    return new Response(e.message || "Verification failed", { status: 400 });
  }
}
