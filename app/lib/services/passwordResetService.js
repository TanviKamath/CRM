import bcrypt from "bcryptjs";
import { resetPasswordSchema } from "@/lib/validators/resetPasswordSchema";
import { findUserByEmail, createUser } from "@/lib/queries/userQueries";
import { findPasswordReset, deletePasswordReset } from "@/lib/queries/passwordResetQueries";
import db from "@/lib/db";

export async function resetPassword(body) {
  // 1. Validate
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("Validation failed");
  }

  const { email, token, password } = parsed.data;

  // 2. Check password reset token
  const resetRecord = await findPasswordReset(email, token);
  if (!resetRecord) {
    throw new Error("Invalid or expired password reset token");
  }

  // 3. Find user
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  // 4. Hash password (Laravel: Hash::make)
  const hashed = await bcrypt.hash(password, 10);

  // 5. Update user in DB
  await db("users").where({ email }).update({ password: hashed });

  // 6. Delete reset token
  await deletePasswordReset(email);

  return {
    message: "Password reset successfully.",
    redirectTo: "/home",
  };
}
