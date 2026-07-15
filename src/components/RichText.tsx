import { staticLinkClassName } from "@/lib/linkStyles";
import { parseRichText } from "@/lib/richText";
import { RichTextLink } from "@/components/RichTextLink";
import type { LinkSource } from "@/lib/statsTypes";

type RichTextProps = {
  content?: string | null;
  className?: string;
  fallback?: string;
  interactive?: boolean;
  linkSource?: LinkSource;
  linkContextId?: string | null;
};

export function RichText({
  content,
  className = "",
  fallback,
  interactive = true,
  linkSource,
  linkContextId,
}: RichTextProps) {
  const value = content?.trim();

  if (!value) {
    if (!fallback) return null;
    return <p className={className}>{fallback}</p>;
  }

  const parts = parseRichText(value);

  return (
    <div
      className={`whitespace-pre-wrap leading-relaxed [&_a]:break-words ${className}`}
    >
      {parts.map((part, index) => {
        if (part.type === "text") {
          return <span key={index}>{part.value}</span>;
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
