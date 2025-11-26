import crypto from "crypto";
import { verifyEmailSchema } from "@/lib/validators/verifyEmailSchema";
import { findUserById, markEmailVerified, isEmailVerified } from "@/lib/queries/userQueries";
import { sendVerificationEmail } from "@/lib/utils/mail";

const APP_URL = process.env.APP_URL;

// Create signed URL (Laravel style)
export function createSignedVerificationUrl(user) {
  const expires = Date.now() + 1000 * 60 * 60; // 1 hour expiry
  const url = `${APP_URL}/api/auth/verify?id=${user.id}&expires=${expires}`;

  const signature = crypto
    .createHmac("sha256", process.env.SIGNING_KEY)
    .update(`${user.id}|${expires}`)
    .digest("hex");

  return `${url}&signature=${signature}`;
}

// Verify signed link
export function verifySignature(id, expires, signature) {
  if (Date.now() > Number(expires)) {
    throw new Error("Verification link expired");
  }

  const expected = crypto
    .createHmac("sha256", process.env.SIGNING_KEY)
    .update(`${id}|${expires}`)
    .digest("hex");

  if (expected !== signature) {
    throw new Error("Invalid signature");
  }
}

// Service: Handle verification
export async function verifyEmail(params) {
  const parsed = verifyEmailSchema.safeParse(params);
  if (!parsed.success) throw new Error("Invalid verification request");

  const { id, expires, signature } = parsed.data;

  // 1. Validate signature
  verifySignature(id, expires, signature);

  // 2. Check if user exists
  const user = await findUserById(id);
  if (!user) throw new Error("User not found");

  // 3. Skip if already verified (same as Laravel)
  if (await isEmailVerified(id)) {
    return { redirectTo: "/home", message: "Already verified" };
  }

  // 4. Mark email as verified
  await markEmailVerified(id);

  return {
    redirectTo: "/home",
    message: "Email verified successfully.",
  };
}

// Resend verification link (same behavior as Laravel)
export async function resendVerificationEmail(user) {
  const url = createSignedVerificationUrl(user);
  await sendVerificationEmail(user.email, url);
  return { message: "Verification link sent." };
}
