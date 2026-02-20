import { verifyToken, logoutUser } from "../../../lib/services/authService";
import { cookies } from "next/headers";

export async function POST(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded?.id) {
      await logoutUser(decoded.id);
    }
  }

  return new Response("Logged out", {
    status: 200,
    headers: {
      "Set-Cookie": `token=; HttpOnly; Path=/; Max-Age=0`,
    },
  });
}
