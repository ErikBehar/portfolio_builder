import { RichText } from "@/components/RichText";

type SiteFooterProps = {
  footerText?: string | null;
};

export function SiteFooter({ footerText }: SiteFooterProps) {
  const value = (footerText ?? "").trim();
  if (!value) return null;

  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto max-w-6xl px-6 py-8 text-center">
        <RichText content={value} className="text-sm text-muted" linkSource="footer" />
      </div>
    </footer>
  );
}
