import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const hasCloudinaryConfig = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (!hasCloudinaryConfig) {
      const mimeType = file.type || "application/octet-stream";
      const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

      return NextResponse.json({
        url: dataUrl,
      });
    }

    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "velorae",
        },
        (error, result) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      stream.end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
    });
  } catch (error: any) {
    console.error("UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
