import {
  buildCommentNotificationEmail,
  type AdminCommentItem,
} from "@/lib/adminComments";
import type { CommentParentType } from "@/lib/comments";
import { getSiteSettings } from "@/lib/siteSettings";

function getSiteOrigin(requestOrigin?: string | null): string {
  const fromEnv =
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "";
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (requestOrigin) return requestOrigin.replace(/\/$/, "");
  return "";
}

export async function maybeSendCommentNotification(input: {
  parentType: CommentParentType;
  parentTitle: string;
  parentPath: string;
  author: string;
  content: string;
  requestOrigin?: string | null;
}): Promise<void> {
  const settings = await getSiteSettings();
  if (!settings.commentEmailNotify) return;

  const to = settings.commentNotifyEmail.trim();
  if (!to) return;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn(
      "[commentEmail] RESEND_API_KEY is not set; skipping comment notification email"
    );
    return;
  }

  const origin = getSiteOrigin(input.requestOrigin);
  const parentUrl = origin
    ? `${origin}${input.parentPath}`
    : input.parentPath;
  const adminCommentsUrl = origin
    ? `${origin}/admin/comments`
    : "/admin/comments";

  const from =
    process.env.COMMENT_NOTIFY_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Portfolio Comments <onboarding@resend.dev>";

  const { subject, text, html } = buildCommentNotificationEmail({
    siteTitle: settings.title,
    author: input.author,
    content: input.content,
    parentType: input.parentType,
    parentTitle: input.parentTitle,
    parentUrl,
    adminCommentsUrl,
  });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `[commentEmail] Resend failed (${response.status}): ${body}`
      );
    }
  } catch (error) {
    console.error("[commentEmail] Failed to send notification:", error);
  }
}

export type { AdminCommentItem };
