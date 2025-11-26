import { sendMail } from "@/lib/mail";

export async function POST(req) {
  const body = await req.json();

  const { to, subject, message } = body;

  await sendMail({
    to,
    subject,
    html: message,
  });

  return Response.json({ success: true });
}
