"use client";

type RichTextLinkProps = {
  href: string;
  label: string;
};

const linkClassName =
  "text-accent underline decoration-accent/50 underline-offset-2 transition-colors hover:text-foreground hover:decoration-accent";

export function RichTextLink({ href, label }: RichTextLinkProps) {
  const external = href.startsWith("http");

  return (
    <a
      href={href}
      className={linkClassName}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      onClick={(event) => event.stopPropagation()}
    >
      {label}
    </a>
  );
}
