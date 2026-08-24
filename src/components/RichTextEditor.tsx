"use client";

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { RichTextFieldHint } from "@/components/RichTextFieldHint";
import { uploadFile } from "@/lib/clientUpload";
import {
  fileStemAlt,
  insertMarkdownImage,
  insertMarkdownLink,
  wrapSelection,
  type MarkdownEditResult,
} from "@/lib/markdownInsert";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  placeholder?: string;
};

const toolbarButtonClassName =
  "rounded-md px-2.5 py-1 text-sm text-muted transition-colors hover:bg-surface-elevated hover:text-foreground disabled:opacity-60";

const IMAGE_SRC_PATTERN = /^(https?:\/\/\S+|\/uploads\/[^\s/\\]+)$/i;
const IMAGE_MARKDOWN_PATTERN = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

export function RichTextEditor({
  value,
  onChange,
  rows = 8,
  required,
  placeholder,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);
  const savedSelection = useRef<{ start: number; end: number } | null>(null);
  const textareaId = useId();
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useLayoutEffect(() => {
    const selection = pendingSelection.current;
    const textarea = textareaRef.current;
    if (!selection || !textarea) return;

    textarea.focus();
    textarea.setSelectionRange(selection.start, selection.end);
    pendingSelection.current = null;
  });

  function applyEdit(result: MarkdownEditResult) {
    pendingSelection.current = {
      start: result.selectionStart,
      end: result.selectionEnd,
    };
    onChange(result.value);
  }

  function selectionRange() {
    const textarea = textareaRef.current;
    return {
      start: textarea?.selectionStart ?? value.length,
      end: textarea?.selectionEnd ?? value.length,
    };
  }

  function applyBold() {
    const { start, end } = selectionRange();
    applyEdit(wrapSelection(value, start, end, "**", "**", "bold text"));
  }

  function applyItalic() {
    const { start, end } = selectionRange();
    applyEdit(wrapSelection(value, start, end, "*", "*", "italic text"));
  }

  function applyLink() {
    const { start, end } = selectionRange();
    applyEdit(insertMarkdownLink(value, start, end));
  }

  function applyImage() {
    const range = selectionRange();
    const selected = value.slice(range.start, range.end).trim();

    if (
      IMAGE_MARKDOWN_PATTERN.test(selected) ||
      IMAGE_SRC_PATTERN.test(selected)
    ) {
      applyEdit(insertMarkdownImage(value, range.start, range.end));
      return;
    }

    savedSelection.current = range;
    fileInputRef.current?.click();
  }

  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const range = savedSelection.current ?? selectionRange();
    savedSelection.current = null;
    setIsUploading(true);
    setUploadStatus("Uploading image...");

    try {
      const src = await uploadFile(file);
      const selected = value.slice(range.start, range.end).trim();
      const alt = selected || fileStemAlt(file.name);
      applyEdit(
        insertMarkdownImage(value, range.start, range.end, { alt, src })
      );
      setUploadStatus(null);
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;

    if (event.key === "b" || event.key === "B") {
      event.preventDefault();
      applyBold();
    } else if (event.key === "i" || event.key === "I") {
      event.preventDefault();
      applyItalic();
    } else if (event.key === "k" || event.key === "K") {
      event.preventDefault();
      applyLink();
    }
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-border bg-surface focus-within:border-accent">
        <div className="flex flex-wrap gap-1 border-b border-border px-2 py-1.5">
          <button
            type="button"
            className={`${toolbarButtonClassName} font-bold`}
            title="Bold (Ctrl+B)"
            aria-label="Bold"
            onClick={applyBold}
          >
            B
          </button>
          <button
            type="button"
            className={`${toolbarButtonClassName} italic`}
            title="Italic (Ctrl+I)"
            aria-label="Italic"
            onClick={applyItalic}
          >
            I
          </button>
          <button
            type="button"
            className={toolbarButtonClassName}
            title="Link (Ctrl+K)"
            aria-label="Insert link"
            onClick={applyLink}
          >
            Link
          </button>
          <button
            type="button"
            className={toolbarButtonClassName}
            title="Embed image — upload a file, or select a URL first"
            aria-label="Embed image"
            disabled={isUploading}
            onClick={applyImage}
          >
            Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
        <textarea
          id={textareaId}
          ref={textareaRef}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={rows}
          className="w-full resize-y bg-transparent px-3 py-2 font-mono text-sm outline-none"
          placeholder={placeholder}
        />
      </div>
      {uploadStatus && <p className="text-sm text-muted">{uploadStatus}</p>}
      <RichTextFieldHint />
    </div>
  );
}
