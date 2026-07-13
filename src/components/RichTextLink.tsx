"use client";

import type { LinkSource } from "@/lib/statsTypes";
import { isTrackableExternalUrl } from "@/lib/statsTypes";
import { trackLinkClick } from "@/lib/clientStats";

type RichTextLinkProps = {
  href: string;
  label: string;
  linkSource?: LinkSource;
  linkContextId?: string | null;
};

const linkClassName =
  "text-accent underline decoration-accent/50 underline-offset-2 transition-colors hover:text-foreground hover:decoration-accent";

export function RichTextLink({
  href,
  label,
  linkSource,
  linkContextId,
}: RichTextLinkProps) {
  const external = href.startsWith("http");

  return (
    <a
      href={href}
      className={linkClassName}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      onClick={(event) => {
        event.stopPropagation();

        if (linkSource && isTrackableExternalUrl(href)) {
          trackLinkClick({
            url: href,
            source: linkSource,
            contextId: linkContextId,
            label,
          });
        }
      }}
    >
      {label}
    </a>
  );
}
