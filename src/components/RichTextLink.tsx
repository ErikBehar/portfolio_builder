"use client";

import { richTextLinkClassName } from "@/lib/linkStyles";
import type { LinkSource } from "@/lib/statsTypes";
import { isTrackableExternalUrl } from "@/lib/statsTypes";
import { trackLinkClick } from "@/lib/clientStats";

type RichTextLinkProps = {
  href: string;
  label: string;
  linkSource?: LinkSource;
  linkContextId?: string | null;
};

const linkClassName = richTextLinkClassName;

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
