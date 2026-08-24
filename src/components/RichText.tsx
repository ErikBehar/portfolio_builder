import type { ReactNode } from "react";
import { staticLinkClassName } from "@/lib/linkStyles";
import { excerptRichTextParts, parseRichText } from "@/lib/richText";
import { RichTextLink } from "@/components/RichTextLink";
import type { LinkSource } from "@/lib/statsTypes";

type RichTextProps = {
  content?: string | null;
  className?: string;
  fallback?: string;
  interactive?: boolean;
  maxLength?: number;
  linkSource?: LinkSource;
  linkContextId?: string | null;
};

export function RichText({
  content,
  className = "",
  fallback,
  interactive = true,
  maxLength,
  linkSource,
  linkContextId,
}: RichTextProps) {
  const value = content?.trim();

  if (!value) {
    if (!fallback) return null;
    return <p className={className}>{fallback}</p>;
  }

  const parts =
    maxLength === undefined
      ? parseRichText(value)
      : excerptRichTextParts(value, maxLength);

  return (
    <div
      className={`whitespace-pre-wrap leading-relaxed [&_a]:break-words ${className}`}
    >
      {parts.map((part, index) => {
        if (part.type === "text") {
          let node: ReactNode = part.value;
          if (part.italic) node = <em>{node}</em>;
          if (part.bold) node = <strong>{node}</strong>;
          return <span key={index}>{node}</span>;
        }

        if (part.type === "image") {
          if (!interactive || maxLength !== undefined) {
            return part.alt ? <span key={index}>{part.alt}</span> : null;
          }

          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={index}
              src={part.src}
              alt={part.alt}
              className="my-3 block max-h-[36rem] w-full rounded-lg border border-border bg-surface-elevated object-contain"
            />
          );
        }

        if (!interactive) {
          return (
            <span key={index} className={staticLinkClassName}>
              {part.label}
            </span>
          );
        }

        return (
          <RichTextLink
            key={index}
            href={part.href}
            label={part.label}
            linkSource={linkSource}
            linkContextId={linkContextId}
          />
        );
      })}
    </div>
  );
}
