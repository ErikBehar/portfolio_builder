"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HeaderLinkIcon } from "@/components/HeaderLinkIcon";
import type { HeaderLink } from "@/lib/headerLinks";

type AdminHeaderLinksReorderProps = {
  links: HeaderLink[];
};

function DragHandleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-4 w-4 text-muted"
      aria-hidden
    >
      <circle cx="5" cy="4" r="1.25" />
      <circle cx="11" cy="4" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="11" cy="12" r="1.25" />
    </svg>
  );
}

function SortableHeaderLinkChip({ link }: { link: HeaderLink }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex shrink-0 flex-col gap-2 rounded-xl border bg-surface px-4 py-3 ${
        isDragging
          ? "border-accent opacity-40 shadow-lg"
          : "border-border"
      }`}
    >
      <button
        type="button"
        className="flex cursor-grab items-center gap-2 touch-none active:cursor-grabbing"
        aria-label={`Drag to reorder ${link.label}`}
        {...attributes}
        {...listeners}
      >
        <DragHandleIcon />
        <span className="inline-flex rounded-md border border-border bg-surface-elevated p-2">
          <HeaderLinkIcon
            icon={link.icon}
            iconImageUrl={link.iconImageUrl}
          />
        </span>
        <span className="whitespace-nowrap text-sm font-medium">{link.label}</span>
      </button>
      <Link
        href={`/admin/header-links/${link.id}`}
        className="text-center text-xs text-accent hover:underline"
      >
        Edit
      </Link>
    </div>
  );
}

function HeaderLinkChipPreview({ link }: { link: HeaderLink }) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-accent bg-surface px-4 py-3 shadow-xl">
      <DragHandleIcon />
      <span className="inline-flex rounded-md border border-border bg-surface-elevated p-2">
        <HeaderLinkIcon
          icon={link.icon}
          iconImageUrl={link.iconImageUrl}
        />
      </span>
      <span className="whitespace-nowrap text-sm font-medium">{link.label}</span>
    </div>
  );
}

export function AdminHeaderLinksReorder({
  links: initialLinks,
}: AdminHeaderLinksReorderProps) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeLink = activeId
    ? links.find((link) => link.id === activeId) ?? null
    : null;

  async function persistOrder(nextLinks: HeaderLink[]) {
    setIsSaving(true);
    setStatus("Saving order...");

    const response = await fetch("/api/header-links/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: nextLinks.map((link) => link.id) }),
    });

    const data = await response.json().catch(() => null);
    setIsSaving(false);

    if (!response.ok) {
      setLinks(initialLinks);
      setStatus(data?.error ?? "Failed to save order");
      return;
    }

    setLinks(data);
    setStatus("Order saved.");
    router.refresh();
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setStatus(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((link) => link.id === active.id);
    const newIndex = links.findIndex((link) => link.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const nextLinks = arrayMove(links, oldIndex, newIndex);
    setLinks(nextLinks);
    void persistOrder(nextLinks);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Drag links left or right to match the order shown in the site header.
        {isSaving ? " Saving…" : status ? ` ${status}` : ""}
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={links.map((link) => link.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-3 overflow-x-auto pb-2">
            {links.map((link) => (
              <SortableHeaderLinkChip key={link.id} link={link} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeLink ? <HeaderLinkChipPreview link={activeLink} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
