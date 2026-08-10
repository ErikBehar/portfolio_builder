"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HEADER_LINK_ICON_SIZES,
  type HeaderLinkIconSize,
} from "@/lib/headerLinkIcons";

type AdminHeaderLinkIconSizeProps = {
  value: HeaderLinkIconSize;
};

export function AdminHeaderLinkIconSize({
  value: initialValue,
}: AdminHeaderLinkIconSizeProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  async function handleChange(next: HeaderLinkIconSize) {
    const previous = value;
    setValue(next);
    setIsSaving(true);
    setStatus("Saving icon size...");

    const response = await fetch("/api/header-links/icon-size", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headerLinkIconSize: next }),
    });

    const data = await response.json().catch(() => null);
    setIsSaving(false);

    if (!response.ok) {
      setValue(previous);
      setStatus(data?.error ?? "Failed to save icon size");
      return;
    }

    setValue(data.headerLinkIconSize ?? next);
    setStatus("Icon size saved.");
    router.refresh();
  }

  return (
    <div className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface px-4 py-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium">Icon size</span>
        <select
          value={value}
          disabled={isSaving}
          onChange={(event) =>
            handleChange(event.target.value as HeaderLinkIconSize)
          }
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {HEADER_LINK_ICON_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label} ({size.px}px)
            </option>
          ))}
        </select>
      </label>
      <p className="pb-2 text-sm text-muted">
        Applies to all header link icons. Each step is 2× the previous size.
        {status ? ` ${status}` : ""}
      </p>
    </div>
  );
}
