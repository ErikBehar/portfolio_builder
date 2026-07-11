import Link from "next/link";
import type { Section } from "@/lib/sections";

type SectionNavProps = {
  sections: Section[];
};

export function SectionNav({ sections }: SectionNavProps) {
  if (sections.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
        No sections yet.
      </div>
    );
  }

  return (
    <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map((section) => (
        <Link
          key={section.id}
          href={`/${section.slug}`}
          className="group rounded-xl border border-border border-l-4 bg-surface p-5 transition-all hover:border-accent/60 hover:shadow-lg hover:shadow-accent/5"
          style={{ borderLeftColor: section.color }}
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground group-hover:text-accent">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: section.color }}
              aria-hidden
            />
            {section.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {section.description}
          </p>
        </Link>
      ))}
    </nav>
  );
}
