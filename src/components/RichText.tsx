import { parseRichText } from "@/lib/richText";

type RichTextProps = {
  content?: string | null;
  className?: string;
  fallback?: string;
  interactive?: boolean;
};

const linkClassName =
  "text-accent underline decoration-accent/50 underline-offset-2 transition-colors hover:text-foreground hover:decoration-accent";

export function RichText({
  content,
  className = "",
  fallback,
  interactive = true,
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
            <span key={index} className="text-accent">
              {part.label}
            </span>
          );
        }

        const external = part.href.startsWith("http");

        return (
          <a
            key={index}
            href={part.href}
            className={linkClassName}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            onClick={(event) => event.stopPropagation()}
          >
            {part.label}
          </a>
        );
      })}
    </div>
  );
}
