"use client";

import type { LinkSource } from "@/lib/statsTypes";
import { isTrackableExternalUrl } from "@/lib/statsTypes";
import { trackLinkClick } from "@/lib/clientStats";

type TrackedExternalLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  source: LinkSource;
  contextId?: string | null;
  label?: string | null;
  target?: string;
  rel?: string;
};

export function TrackedExternalLink({
  href,
  children,
  className,
  source,
  contextId,
  label,
  target,
  rel,
}: TrackedExternalLinkProps) {
  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={() => {
        if (isTrackableExternalUrl(href)) {
          trackLinkClick({
            url: href,
            source,
            contextId,
            label: label ?? (typeof children === "string" ? children : null),
          });
        }
      }}
    >
      {children}
    </a>
  );
}
