export function RichTextFieldHint() {
  return (
    <p className="text-sm text-muted">
      Supports line breaks,{" "}
      <code className="rounded bg-surface-elevated px-1 py-0.5 text-xs">
        **bold**
      </code>
      ,{" "}
      <code className="rounded bg-surface-elevated px-1 py-0.5 text-xs">
        *italic*
      </code>
      , URLs, links like{" "}
      <code className="rounded bg-surface-elevated px-1 py-0.5 text-xs">
        [GitHub](https://github.com/you)
      </code>
      , and images like{" "}
      <code className="rounded bg-surface-elevated px-1 py-0.5 text-xs">
        ![alt](https://example.com/photo.jpg)
      </code>
      . Use Image to upload a file or wrap a selected URL.
    </p>
  );
}
