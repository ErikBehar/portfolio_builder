export function RichTextFieldHint() {
  return (
    <p className="text-sm text-muted">
      Supports line breaks, URLs, and markdown-style links like{" "}
      <code className="rounded bg-surface-elevated px-1 py-0.5 text-xs">
        [GitHub](https://github.com/you)
      </code>
      .
    </p>
  );
}
