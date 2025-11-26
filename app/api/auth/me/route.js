import { cookies } from "next/headers";
import { verifyToken, getUser } from "../../../lib/services/authService";

export async function GET() {
  try {
    const token = cookies().get("token")?.value;

    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(decoded.id);
    return Response.json(user);
  } catch (err) {
    return new Response("Unauthorized", { status: 401 });
  }
}
