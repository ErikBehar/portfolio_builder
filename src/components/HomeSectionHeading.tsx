import type { ReactNode } from "react";

type HomeSectionHeadingProps = {
  children: ReactNode;
  color: string;
  as?: "h2" | "h3";
  className?: string;
};

export function HomeSectionHeading({
  children,
  color,
  as: Tag = "h2",
  className = "mb-6",
}: HomeSectionHeadingProps) {
  return (
    <Tag
      className={`text-3xl font-semibold tracking-tight sm:text-4xl ${className}`}
      style={{ color }}
    >
      {children}
    </Tag>
  );
}
