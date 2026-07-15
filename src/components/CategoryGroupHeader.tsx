type CategoryGroupHeaderProps = {
  title: string;
  accentColor: string;
};

export function CategoryGroupHeader({
  title,
  accentColor,
}: CategoryGroupHeaderProps) {
  return (
    <div
      className="mb-10 rounded-xl border border-border bg-surface px-5 py-4 shadow-sm"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <h2
        className="text-2xl font-bold tracking-tight"
        style={{ color: accentColor }}
      >
        {title}
      </h2>
    </div>
  );
}
