export async function sendResetEmail(email, token) {
  const resetUrl = `${process.env.APP_URL}/auth/reset-password?email=${email}&token=${token}`;

  // You will integrate your actual mail provider here (Mailgun, SMTP, etc.)
  console.log("Password reset email sent to:", email, "URL:", resetUrl);
}

export async function sendVerificationEmail(email, url) {
  console.log("Verification email sent to:", email, "URL:", url);
}