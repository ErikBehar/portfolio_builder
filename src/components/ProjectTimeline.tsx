"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatLogDate } from "@/lib/dates";
import { usePersistedLabelFilters } from "@/hooks/usePersistedLabelFilters";
import { projectMatchesLabels } from "@/lib/labelFilter";
import { getProjectCoverMedia } from "@/lib/media";
import { RichText } from "@/components/RichText";
import type { ProjectLabel, ProjectWithMedia } from "@/lib/types";

export type TimelineEntry = {
  project: ProjectWithMedia;
  sectionTitle: string;
  sectionColor: string;
};

export type SectionLegendItem = {
  slug: string;
  title: string;
  color: string;
};

type ProjectTimelineProps = {
  entries: TimelineEntry[];
  allLabels: ProjectLabel[];
  labelCounts: Record<string, number>;
  sectionLegend: SectionLegendItem[];
};

type PositionedEntry = TimelineEntry & {
  x: number;
  lane: number;
};

type TimelineRange = {
  start: Date;
  end: Date;
  monthsSpan: number;
};

const PADDING_MONTHS = 2;
const LANE_HEIGHT = 52;
const AXIS_HEIGHT = 72;
const MARKER_SIZE = 14;
const MIN_MARKER_GAP = 28;
const TIMELINE_SIDE_PADDING = 48;
const MIN_PX_PER_MONTH_FOR_MONTH_LABELS = 40;
const ZOOM_STEP = 1.25;
const MIN_ZOOM_MULTIPLIER = 0.25;
const BASE_MAX_ZOOM_MULTIPLIER = 4;
const ABSOLUTE_MAX_ZOOM_MULTIPLIER = 32;

function getLabelFontSize(count: number, maxCount: number): string {
  if (maxCount <= 0) return "0.875rem";
  const min = 0.75;
  const max = 1.35;
  const ratio = count / maxCount;
  return `${min + ratio * (max - min)}rem`;
}

function projectDate(project: ProjectWithMedia): Date {
  return new Date(project.createdAt);
}

function addUtcMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function getTimelineRange(filteredEntries: TimelineEntry[]): TimelineRange | null {
  if (filteredEntries.length === 0) return null;

  const dates = filteredEntries.map((entry) => projectDate(entry.project));
  const earliest = new Date(Math.min(...dates.map((date) => date.getTime())));
  const latest = new Date(Math.max(...dates.map((date) => date.getTime())));

  const start = addUtcMonths(
    new Date(Date.UTC(earliest.getUTCFullYear(), earliest.getUTCMonth(), 1)),
    -PADDING_MONTHS
  );
  const end = addUtcMonths(
    new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth(), 1)),
    PADDING_MONTHS + 1
  );

  const monthsSpan = Math.max(
    1,
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth())
  );

  return { start, end, monthsSpan };
}

function dateToX(date: Date, start: Date, pxPerMonth: number): number {
  const months =
    (date.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (date.getUTCMonth() - start.getUTCMonth());
  const dayFraction = (date.getUTCDate() - 1) / 31;
  return (months + dayFraction) * pxPerMonth;
}

function assignLanes(items: { entry: TimelineEntry; x: number }[]): PositionedEntry[] {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const laneEnds: number[] = [];

  return sorted.map((item) => {
    let lane = 0;

    while (laneEnds[lane] !== undefined && item.x - laneEnds[lane] < MIN_MARKER_GAP) {
      lane += 1;
    }

    laneEnds[lane] = item.x;

    return {
      ...item.entry,
      x: item.x,
      lane,
    };
  });
}

type TimelineTick = {
  x: number;
  type: "year" | "month";
  label: string;
  showLabel: boolean;
};

function buildTicks(start: Date, end: Date, pxPerMonth: number): TimelineTick[] {
  const showMonthLabels = pxPerMonth >= MIN_PX_PER_MONTH_FOR_MONTH_LABELS;
  // Keep year labels readable when the range is compressed to fit.
  const yearLabelStride = Math.max(1, Math.ceil(36 / Math.max(pxPerMonth * 12, 1)));
  const ticks: TimelineTick[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));

  while (cursor <= end) {
    const x = dateToX(cursor, start, pxPerMonth);

    if (cursor.getUTCMonth() === 0) {
      const year = cursor.getUTCFullYear();
      ticks.push({
        x,
        type: "year",
        label: String(year),
        showLabel: year % yearLabelStride === 0,
      });
    } else {
      ticks.push({
        x,
        type: "month",
        label: cursor.toLocaleDateString("en-US", {
          month: "short",
          timeZone: "UTC",
        }),
        showLabel: showMonthLabels,
      });
    }

    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return ticks;
}

const TIMELINE_DEFAULT_LABELS: string[] = [];

export function ProjectTimeline({
  entries,
  allLabels,
  labelCounts,
  sectionLegend,
}: ProjectTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoomMultiplier, setZoomMultiplier] = useState(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { selectedSlugs, toggleLabel } = usePersistedLabelFilters({
    scope: "timeline",
    defaultSlugs: TIMELINE_DEFAULT_LABELS,
    emptyMeansNone: false,
  });

  const filteredEntries = useMemo(
    () =>
      selectedSlugs.length === 0
        ? entries
        : entries.filter((entry) =>
            projectMatchesLabels(entry.project, selectedSlugs)
          ),
    [entries, selectedSlugs]
  );

  const timelineRange = useMemo(
    () => getTimelineRange(filteredEntries),
    [filteredEntries]
  );

  const timelineRangeKey = timelineRange
    ? `${timelineRange.start.getTime()}-${timelineRange.end.getTime()}-${timelineRange.monthsSpan}-${filteredEntries.length}`
    : "empty";

  useEffect(() => {
    if (!timelineRange) {
      setContainerWidth(0);
      return;
    }

    const element = timelineContainerRef.current;
    if (!element) return;

    const updateWidth = () => {
      setContainerWidth(element.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, [timelineRange, timelineRangeKey]);

  useEffect(() => {
    setZoomMultiplier(1);
  }, [timelineRangeKey]);

  const fitPxPerMonth = useMemo(() => {
    if (!timelineRange || containerWidth <= 0) return null;

    // True fit: span the full date range inside the visible width (no min clamp).
    const availableWidth = Math.max(
      containerWidth - TIMELINE_SIDE_PADDING * 2,
      120
    );
    return availableWidth / timelineRange.monthsSpan;
  }, [containerWidth, timelineRange]);

  // Long fitted ranges need more than 4x zoom before month ticks have room for labels.
  const maxZoomMultiplier = useMemo(() => {
    if (!fitPxPerMonth || fitPxPerMonth <= 0) return BASE_MAX_ZOOM_MULTIPLIER;
    const neededForMonthLabels =
      MIN_PX_PER_MONTH_FOR_MONTH_LABELS / fitPxPerMonth;
    return Math.min(
      ABSOLUTE_MAX_ZOOM_MULTIPLIER,
      Math.max(BASE_MAX_ZOOM_MULTIPLIER, neededForMonthLabels)
    );
  }, [fitPxPerMonth]);

  useEffect(() => {
    setZoomMultiplier((current) =>
      Math.min(current, maxZoomMultiplier)
    );
  }, [maxZoomMultiplier]);

  const pxPerMonth =
    fitPxPerMonth !== null ? fitPxPerMonth * zoomMultiplier : null;
  const maxCount = Math.max(0, ...Object.values(labelCounts));

  const layout = useMemo(() => {
    if (!timelineRange || pxPerMonth === null) return null;

    const positioned = assignLanes(
      filteredEntries.map((entry) => ({
        entry,
        x:
          TIMELINE_SIDE_PADDING +
          dateToX(projectDate(entry.project), timelineRange.start, pxPerMonth),
      }))
    );

    const maxLane = positioned.reduce((max, item) => Math.max(max, item.lane), 0);
    const contentWidth =
      TIMELINE_SIDE_PADDING * 2 +
      dateToX(timelineRange.end, timelineRange.start, pxPerMonth);
    // At 100% zoom this equals containerWidth; when zoomed in, allow scroll.
    const totalWidth = Math.max(contentWidth, containerWidth || 0);
    const ticks = buildTicks(timelineRange.start, timelineRange.end, pxPerMonth).map(
      (tick) => ({
        ...tick,
        x: tick.x + TIMELINE_SIDE_PADDING,
      })
    );

    return {
      positioned,
      maxLane,
      totalWidth,
      ticks,
      contentHeight: AXIS_HEIGHT + (maxLane + 1) * LANE_HEIGHT + 48,
    };
  }, [containerWidth, filteredEntries, pxPerMonth, timelineRange]);

  function zoomOut() {
    setZoomMultiplier((current) =>
      Math.max(MIN_ZOOM_MULTIPLIER, Number((current / ZOOM_STEP).toFixed(3)))
    );
  }

  function zoomIn() {
    setZoomMultiplier((current) =>
      Math.min(maxZoomMultiplier, Number((current * ZOOM_STEP).toFixed(3)))
    );
  }

  const emptyMessage = "No projects match the selected labels.";

  const hovered = layout?.positioned.find((item) => item.project.id === hoveredId);
  const hoveredCover = hovered ? getProjectCoverMedia(hovered.project) : undefined;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted">
          Filter by label
        </h2>
        <div className="flex flex-wrap gap-3">
          {allLabels.map((label) => {
            const count = labelCounts[label.slug] ?? 0;
            const selected = selectedSlugs.includes(label.slug);

            return (
              <button
                key={label.id}
                type="button"
                onClick={() => toggleLabel(label.slug)}
                className={`rounded-full border px-4 py-2 transition-colors ${
                  selected
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border bg-surface text-muted hover:border-accent/60 hover:text-foreground"
                }`}
                style={{ fontSize: getLabelFontSize(count, maxCount) }}
              >
                {label.name}
                {count > 0 && (
                  <span className="ml-2 text-xs opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {sectionLegend.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {sectionLegend.map((section) => (
            <div key={section.slug} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-3 w-3 rounded-full border border-white/40"
                style={{ backgroundColor: section.color }}
                aria-hidden
              />
              <span className="text-muted">{section.title}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {filteredEntries.length} project{filteredEntries.length === 1 ? "" : "s"} ·
          {zoomMultiplier === 1 ? " fit to view" : " zoom adjusted"} · hover for details
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoomMultiplier <= MIN_ZOOM_MULTIPLIER}
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:border-accent disabled:opacity-50"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="min-w-[4rem] text-center text-sm text-muted">
            {Math.round(zoomMultiplier * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoomMultiplier >= maxZoomMultiplier}
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:border-accent disabled:opacity-50"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      {!timelineRange ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
          {entries.length === 0 ? "No projects yet." : emptyMessage}
        </div>
      ) : (
        <div ref={timelineContainerRef} className="w-full">
          {pxPerMonth === null || !layout ? (
            <div className="rounded-xl border border-border bg-surface p-10 text-center text-muted">
              Loading timeline...
            </div>
          ) : (
            <div className="relative">
              {hovered && (
            <div
              className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 w-64 -translate-x-1/2 rounded-xl border border-border bg-surface-elevated p-3 text-center shadow-xl shadow-black/30"
              role="status"
              aria-live="polite"
            >
              {hoveredCover?.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hoveredCover.url}
                  alt=""
                  className="mx-auto mb-3 h-20 w-full max-w-[10rem] rounded-md object-cover"
                />
              ) : null}

              <p
                className="text-[10px] font-medium uppercase tracking-[0.15em]"
                style={{ color: hovered.sectionColor }}
              >
                {hovered.sectionTitle}
              </p>
              <h3 className="mt-1 text-sm font-medium">{hovered.project.title}</h3>
              <p className="mt-1 text-xs text-muted">
                {formatLogDate(hovered.project.createdAt)}
              </p>

              {hovered.project.description && (
                <RichText
                  content={hovered.project.description}
                  className="mt-2 line-clamp-2 text-xs text-muted"
                  linkSource="rich-text"
                  linkContextId={hovered.project.id}
                />
              )}

              {hovered.project.labels.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  {hovered.project.labels.map((label) => (
                    <span
                      key={label.id}
                      className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted"
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div
            ref={scrollContainerRef}
            className="overflow-x-auto rounded-xl border border-border bg-surface"
          >
          <div
            className="relative"
            style={{ width: layout.totalWidth, height: layout.contentHeight }}
          >
            <div
              className="absolute inset-x-0 top-0 border-b border-border bg-surface-elevated"
              style={{ height: AXIS_HEIGHT }}
            >
              {layout.ticks.map((tick) => (
                <div
                  key={`${tick.type}-${tick.x}-${tick.label}`}
                  className="absolute bottom-0 flex flex-col items-center"
                  style={{ left: tick.x, transform: "translateX(-50%)" }}
                >
                  {tick.type === "year" ? (
                    <>
                      {tick.showLabel && (
                        <span className="mb-2 text-xs font-medium text-foreground">
                          {tick.label}
                        </span>
                      )}
                      <div
                        className={`w-px bg-accent ${tick.showLabel ? "h-8" : "h-5"}`}
                      />
                    </>
                  ) : (
                    <>
                      {tick.showLabel && (
                        <span className="mb-2 text-[10px] uppercase tracking-wide text-muted">
                          {tick.label}
                        </span>
                      )}
                      <div className="h-4 w-px bg-border" />
                    </>
                  )}
                </div>
              ))}
            </div>

            {layout.positioned.map((item) => {
              const top = AXIS_HEIGHT + 24 + item.lane * LANE_HEIGHT;
              const isHovered = hoveredId === item.project.id;

              return (
                <div
                  key={item.project.id}
                  className="absolute"
                  style={{ left: item.x, top, transform: "translateX(-50%)" }}
                >
                  <Link
                    href={`/${item.project.section}/${item.project.slug}`}
                    className="group block"
                    onMouseEnter={() => setHoveredId(item.project.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setHoveredId(item.project.id)}
                    onBlur={() => setHoveredId(null)}
                  >
                    <div
                      className={`rounded-full border-2 transition-transform group-hover:scale-125 ${
                        isHovered ? "border-foreground" : "border-white/70"
                      }`}
                      style={{
                        width: MARKER_SIZE,
                        height: MARKER_SIZE,
                        backgroundColor: item.sectionColor,
                        boxShadow: `0 4px 14px ${item.sectionColor}66`,
                      }}
                      aria-label={item.project.title}
                    />
                    <span className="pointer-events-none absolute left-1/2 top-5 w-max max-w-40 -translate-x-1/2 truncate text-center text-xs text-muted group-hover:text-foreground">
                      {item.project.title}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
