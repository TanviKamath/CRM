import crypto from "crypto";
import { forgotPasswordSchema } from "@/lib/validators/forgotPasswordSchema";
import { findUserByEmail } from "@/lib/queries/userQueries";
import { createPasswordReset } from "@/lib/queries/passwordResetQueries";
import { sendResetEmail } from "@/lib/utils/mail"; // (we define this next)

export async function sendForgotPasswordEmail(body) {
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("Validation failed");
  }

  const { email } = parsed.data;

  const user = await findUserByEmail(email);
  if (!user) {
    // Laravel does NOT reveal that user doesn't exist
    return {
      message: "If this email exists, a reset link has been sent."
    };
  }

  // Generate reset token (Laravel uses Str::random(60), we use secure crypto)
  const token = crypto.randomBytes(30).toString("hex");

  // Insert into password_resets table
  await createPasswordReset(email, token);

  // Send reset link email
  await sendResetEmail(email, token);

  return {
    message: "Reset link sent.",
  };
}
