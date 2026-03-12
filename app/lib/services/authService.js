import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { userSchema } from "../../lib/validators/userSchema";
import {
  findUserByEmail,
  createUser,
  findUserById,
  updateUser,
} from "../../lib/queries/userQueries";

const JWT_SECRET = process.env.JWT_SECRET;

// ----------------------------------------------------
// LOGIN
// ----------------------------------------------------
export async function loginUser(email, password) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is missing in .env");

  const user = await findUserByEmail(email);
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  // Create new session ID and always allow login (replaces stale sessions)
  const sessionId = require('crypto').randomUUID();

  // Update user with new session ID (overrides previous session if any)
  await updateUser(user.id, { current_session_id: sessionId });

  const token = jwt.sign(
    { id: user.id, email: user.email, sessionId },
    JWT_SECRET,
    { expiresIn: "30m" }
  );

  return {
    token,
    redirectTo: "/",   // ✔ redirect to dashboard
  };
}

// ----------------------------------------------------
// LOGOUT
// ----------------------------------------------------
export async function logoutUser(userId) {
  if (userId) {
    await updateUser(userId, { current_session_id: null });
  }
  return { message: "Logged out successfully." };
}

// ----------------------------------------------------
// REGISTER
// ----------------------------------------------------
export async function registerUser(body) {
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) throw new Error("Validation failed");

  const { name, email, password } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  await createUser({
    name,
    email,
    password: hashedPassword,
  });

  return {
    message: "Registered successfully.",
    redirectTo: "/",   // ✔ redirect to dashboard
  };
}

// ----------------------------------------------------
// GET AUTH USER (used by /api/auth/me)
// ----------------------------------------------------
export async function getUser(id) {
  const user = await findUserById(id);
  if (!user) throw new Error("User not found");

  delete user.password;
  delete user.remember_token;

  return user;
}

// ----------------------------------------------------
// VERIFY JWT TOKEN (middleware)
// ----------------------------------------------------
export function verifyToken(token) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET missing");

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
