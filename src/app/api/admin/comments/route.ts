import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  getUnreadCommentCount,
  listAdminComments,
} from "@/lib/adminComments";
import { handleApiError } from "@/lib/apiRoute";

export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "1";
    const [comments, unreadCount] = await Promise.all([
      listAdminComments({ unreadOnly }),
      getUnreadCommentCount(),
    ]);
    return NextResponse.json({ comments, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
