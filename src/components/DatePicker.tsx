"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  buildDateInputValue,
  formatLogDate,
  isValidDateInput,
  parseDateInputParts,
  todayInputValue,
} from "@/lib/dates";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
};

type CalendarCell = {
  value: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const YEAR_START = 1970;

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, month) => ({
  value: month,
  label: new Date(2000, month, 1).toLocaleDateString("en-US", { month: "long" }),
}));

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];

  for (let year = YEAR_START; year <= currentYear + 1; year += 1) {
    years.push(year);
  }

  return years.reverse();
}

function buildCalendarMonth(
  viewYear: number,
  viewMonth: number,
  selectedValue: string,
  todayValue: string
): CalendarCell[] {
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingDays = firstDay.getDay();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const cells: CalendarCell[] = [];

  for (let index = 0; index < totalCells; index += 1) {
    const dayOffset = index - leadingDays + 1;
    const date = new Date(viewYear, viewMonth, dayOffset);
    const value = buildDateInputValue(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );

    cells.push({
      value,
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === viewMonth,
      isToday: value === todayValue,
      isSelected: value === selectedValue,
    });
  }

  return cells;
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-4 w-4"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-4 w-4"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="m14 6-6 6 6 6" />
      ) : (
        <path d="m10 6 6 6-6 6" />
      )}
    </svg>
  );
}

export function DatePicker({
  value,
  onChange,
  label,
  required = false,
  placeholder = "Select a date",
}: DatePickerProps) {
  const fieldId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedParts = parseDateInputParts(value);
  const initialView = selectedParts ?? parseDateInputParts(todayInputValue())!;
  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month - 1);

  const todayValue = todayInputValue();
  const yearOptions = useMemo(() => getYearOptions(), []);

  const calendarCells = useMemo(
    () => buildCalendarMonth(viewYear, viewMonth, value, todayValue),
    [todayValue, value, viewMonth, viewYear]
  );

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!selectedParts) return;
    setViewYear(selectedParts.year);
    setViewMonth(selectedParts.month - 1);
  }, [selectedParts?.month, selectedParts?.year]);

  function openCalendar() {
    if (selectedParts) {
      setViewYear(selectedParts.year);
      setViewMonth(selectedParts.month - 1);
    }
    setIsOpen(true);
  }

  function selectDate(nextValue: string) {
    onChange(nextValue);
    setIsOpen(false);
  }

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const selectClassName =
    "min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground transition-colors hover:border-accent/60 focus:border-accent focus:outline-none";

  const displayValue =
    value && isValidDateInput(value) ? formatLogDate(value) : placeholder;

  return (
    <div ref={rootRef} className="relative space-y-2">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium">
          {label}
        </label>
      )}

      <button
        id={fieldId}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openCalendar())}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-accent/60"
      >
        <span className={value ? "text-foreground" : "text-muted"}>
          {displayValue}
        </span>
        <CalendarIcon />
      </button>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          value={value}
          required
          readOnly
          onChange={() => undefined}
        />
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-label={label ? `${label} calendar` : "Date calendar"}
          className="absolute left-0 top-full z-50 mt-2 w-[min(100%,20rem)] rounded-xl border border-border bg-surface-elevated p-4 shadow-xl shadow-black/30"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="shrink-0 rounded-md border border-border p-1.5 text-muted transition-colors hover:border-accent hover:text-foreground"
              aria-label="Previous month"
            >
              <ChevronIcon direction="left" />
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-2">
              <select
                aria-label="Month"
                value={viewMonth}
                onChange={(event) => setViewMonth(Number(event.target.value))}
                className={selectClassName}
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Year"
                value={viewYear}
                onChange={(event) => setViewYear(Number(event.target.value))}
                className={`${selectClassName} max-w-[5.5rem]`}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="shrink-0 rounded-md border border-border p-1.5 text-muted transition-colors hover:border-accent hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronIcon direction="right" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-wide text-muted">
            {WEEKDAY_LABELS.map((weekday) => (
              <div key={weekday} className="py-1">
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => (
              <button
                key={cell.value}
                type="button"
                onClick={() => selectDate(cell.value)}
                className={`rounded-md py-2 text-sm transition-colors ${
                  cell.isSelected
                    ? "bg-accent text-accent-foreground"
                    : cell.isToday
                      ? "border border-accent/50 text-accent"
                      : cell.inCurrentMonth
                        ? "text-foreground hover:bg-surface hover:text-accent"
                        : "text-muted/60 hover:bg-surface hover:text-foreground"
                }`}
              >
                {cell.day}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => selectDate(todayValue)}
              className="text-sm text-accent hover:underline"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm text-muted hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
