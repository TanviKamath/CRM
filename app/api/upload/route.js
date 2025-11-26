import { writeFile } from "fs/promises";
import path from "path";
import { s3 } from "@/lib/s3";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response("No file uploaded", { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDriver = process.env.UPLOAD_DRIVER || "local";

    // ---------------------------------------------------------
    // LOCAL UPLOAD (public/uploads)
    // ---------------------------------------------------------
    if (uploadDriver === "local") {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      const filePath = path.join(uploadDir, file.name);

      await writeFile(filePath, buffer);

      return Response.json({
        url: `/uploads/${file.name}`,
        driver: "local",
      });
    }

    // ---------------------------------------------------------
    // S3 UPLOAD
    // ---------------------------------------------------------
    if (uploadDriver === "s3") {
      const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: `uploads/${file.name}`,
        Body: buffer,
        ContentType: file.type,
      };

      const upload = await s3.upload(params).promise();

      return Response.json({
        url: upload.Location,
        driver: "s3",
      });
    }

    return new Response("Invalid UPLOAD_DRIVER", { status: 500 });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response("Upload failed", { status: 500 });
  }
}
