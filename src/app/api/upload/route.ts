import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import { ApiError } from "@/lib/apiErrors";
import { saveUploadedFile } from "@/lib/uploads";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError("No file provided", 400);
    }

    const result = await saveUploadedFile(file);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
