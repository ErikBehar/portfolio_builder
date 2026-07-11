import type { HeaderLinkIconSlug } from "@/lib/headerLinkIcons";

type HeaderLinkIconProps = {
  icon: HeaderLinkIconSlug;
  className?: string;
};

export function HeaderLinkIcon({ icon, className = "h-4 w-4" }: HeaderLinkIconProps) {
  const props = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    className,
    "aria-hidden": true as const,
  };

  switch (icon) {
    case "envelope":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16v10H4V7Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
        </svg>
      );
    case "file":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8l-4-5Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
        </svg>
      );
    case "github":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .3-1.8 1-2.5c-3.2-.4-4.7-1.6-4.7-4.5c0-1 .4-1.8 1-2.5c-.1-.4-.4-1.7 0-3.5c0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .4 1.8.1 3.1 0 3.5c.6.7 1 1.5 1 2.5c0 2.9-1.5 4.1-4.7 4.5c.7.6 1 1.4 1 2.5V21"
          />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 11v5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 8v.01" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16v-5a2 2 0 0 1 4 0v5"
          />
          <rect x="3" y="4" width="18" height="16" rx="2" />
        </svg>
      );
    case "twitter":
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4l11.5 7.5L20 20l-4-1.5L8.5 12 4 20V4Z"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <circle cx="12" cy="12" r="3.5" />
          <path strokeLinecap="round" d="M16.5 7.5h.01" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="12" rx="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m10 9.5 5 3-5 3v-6Z" />
        </svg>
      );
    case "globe":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M3 12h18" />
          <path
            strokeLinecap="round"
            d="M12 3c2.5 2.7 2.5 15.3 0 18c-2.5-2.7-2.5-15.3 0-18Z"
          />
        </svg>
      );
    case "link":
    default:
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
        </svg>
      );
  }
}
