"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/cn";
import { useFloatingPopover } from "@/shared/hooks/useFloatingPopover";

import styles from "./DatePicker.module.css";

export type DatePickerProps = {
  className?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  label?: string;
  max?: string;
  maxYear?: number;
  min?: string;
  minYear?: number;
  mode?: "range" | "single";
  name?: string;
  onChange?: (value: string) => void;
  onRangeChange?: (value: DateRangeValue) => void;
  placeholder?: string;
  rangeValue?: DateRangeValue;
  required?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  value?: string;
  variant?: "default" | "filter";
};

export type DateRangeValue = {
  from?: string;
  to?: string;
};

type CalendarView = "day" | "month" | "year";

const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const shortMonthNames = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

const weekdayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function parseDate(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return undefined;
  }

  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }

  return date;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string | undefined) {
  const date = parseDate(value);

  if (!date) {
    return undefined;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDisplayRange(value: DateRangeValue | undefined) {
  const from = formatDisplayDate(value?.from);
  const to = formatDisplayDate(value?.to);

  if (from && to) {
    return `${from} - ${to}`;
  }

  return from ?? to;
}

function clampYear(year: number, minYear: number, maxYear: number) {
  return Math.min(Math.max(year, minYear), maxYear);
}

function getYearPageStart(year: number) {
  return Math.floor(year / 12) * 12;
}

export function DatePicker({
  className,
  disabled,
  error,
  id,
  label,
  max,
  maxYear,
  min,
  minYear = 1940,
  mode = "single",
  name,
  onChange,
  onRangeChange,
  placeholder = "Дата рождения",
  rangeValue,
  required,
  size = "md",
  value,
  variant = "default",
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const dialogId = `${inputId}-calendar`;
  const labelId = label ? `${inputId}-label` : undefined;
  const valueId = `${inputId}-value`;
  const errorId = error ? `${inputId}-error` : undefined;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const resolvedMaxYear = maxYear ?? today.getFullYear();
  const selectedDate = parseDate(value);
  const selectedRangeFrom = parseDate(rangeValue?.from);
  const selectedRangeTo = parseDate(rangeValue?.to);
  const initialSelectedDate =
    mode === "range" ? (selectedRangeFrom ?? selectedRangeTo) : selectedDate;
  const minValue = parseDate(min);
  const maxValue = parseDate(max);
  const initialYear = clampYear(
    initialSelectedDate?.getFullYear() ?? today.getFullYear() - 30,
    minYear,
    resolvedMaxYear,
  );
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarView>("day");
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialSelectedDate?.getMonth() ?? 0);
  const [yearPageStart, setYearPageStart] = useState(getYearPageStart(initialYear));
  const displayValue = mode === "range" ? formatDisplayRange(rangeValue) : formatDisplayDate(value);
  const popoverStyle = useFloatingPopover(open, triggerRef, {
    estimatedHeight: 392,
    maxWidth: 372,
    minWidth: 336,
    preferredWidth: 372,
  });
  const triggerSizeClassName = {
    sm: styles.triggerSm,
    md: styles.triggerMd,
    lg: styles.triggerLg,
    xl: styles.triggerXl,
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const days = (() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const startOffset = (firstDay + 6) % 7;

    return [
      ...Array.from({ length: startOffset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  })();

  const yearOptions = Array.from({ length: 12 }, (_, index) => yearPageStart + index);

  function isDisabledDay(day: number) {
    const dayDate = new Date(viewYear, viewMonth, day);

    if (minValue && dayDate < minValue) {
      return true;
    }

    if (maxValue && dayDate > maxValue) {
      return true;
    }

    return false;
  }

  function isDisabledMonth(year: number, month: number) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    if (year < minYear || year > resolvedMaxYear) {
      return true;
    }

    if (minValue && monthEnd < minValue) {
      return true;
    }

    if (maxValue && monthStart > maxValue) {
      return true;
    }

    return false;
  }

  function isDisabledYear(year: number) {
    if (year < minYear || year > resolvedMaxYear) {
      return true;
    }

    if (minValue && year < minValue.getFullYear()) {
      return true;
    }

    if (maxValue && year > maxValue.getFullYear()) {
      return true;
    }

    return false;
  }

  function canMoveMonth(direction: -1 | 1) {
    const next = new Date(viewYear, viewMonth + direction, 1);

    return !isDisabledMonth(next.getFullYear(), next.getMonth());
  }

  function moveMonth(direction: -1 | 1) {
    if (!canMoveMonth(direction)) {
      return;
    }

    const next = new Date(viewYear, viewMonth + direction, 1);
    setViewYear(clampYear(next.getFullYear(), minYear, resolvedMaxYear));
    setViewMonth(next.getMonth());
  }

  function moveMonthPickerYear(direction: -1 | 1) {
    const nextYear = clampYear(viewYear + direction, minYear, resolvedMaxYear);
    setViewYear(nextYear);
  }

  function moveYearPage(direction: -1 | 1) {
    const nextStart = yearPageStart + direction * 12;
    const minStart = getYearPageStart(minYear);
    const maxStart = getYearPageStart(resolvedMaxYear);
    setYearPageStart(Math.min(Math.max(nextStart, minStart), maxStart));
  }

  function selectDay(day: number) {
    const nextDate = new Date(viewYear, viewMonth, day);
    const nextValue = formatDate(nextDate);

    if (mode === "range") {
      if (!rangeValue?.from || rangeValue.to) {
        onRangeChange?.({ from: nextValue });
        return;
      }

      const fromDate = parseDate(rangeValue.from);

      if (fromDate && nextDate < fromDate) {
        onRangeChange?.({ from: nextValue, to: rangeValue.from });
      } else {
        onRangeChange?.({ from: rangeValue.from, to: nextValue });
      }

      setOpen(false);
      return;
    }

    onChange?.(nextValue);
    setOpen(false);
  }

  function selectMonth(month: number) {
    if (isDisabledMonth(viewYear, month)) {
      return;
    }

    setViewMonth(month);
    setViewMode("day");
  }

  function selectYear(year: number) {
    if (isDisabledYear(year)) {
      return;
    }

    setViewYear(year);
    setYearPageStart(getYearPageStart(year));
    setViewMode("month");
  }

  function handleTriggerClick() {
    setOpen((current) => {
      const nextOpen = !current;

      if (nextOpen) {
        const nextSelectedDate =
          mode === "range"
            ? (parseDate(rangeValue?.from) ?? parseDate(rangeValue?.to))
            : selectedDate;
        const nextYear = clampYear(
          nextSelectedDate?.getFullYear() ?? today.getFullYear() - 30,
          minYear,
          resolvedMaxYear,
        );

        setViewMode("day");
        setViewYear(nextYear);
        setViewMonth(nextSelectedDate?.getMonth() ?? 0);
        setYearPageStart(getYearPageStart(nextYear));
      }

      return nextOpen;
    });
  }

  function getDayRangeState(day: number) {
    if (mode !== "range") {
      return undefined;
    }

    const dayDate = new Date(viewYear, viewMonth, day);
    const fromDate = parseDate(rangeValue?.from);
    const toDate = parseDate(rangeValue?.to);

    if (fromDate && formatDate(dayDate) === formatDate(fromDate)) {
      return "start";
    }

    if (toDate && formatDate(dayDate) === formatDate(toDate)) {
      return "end";
    }

    if (fromDate && toDate && dayDate > fromDate && dayDate < toDate) {
      return "middle";
    }

    return undefined;
  }

  function isSelectedDay(day: number) {
    if (mode === "range") {
      const state = getDayRangeState(day);
      return state === "start" || state === "end";
    }

    return (
      selectedDate?.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  }

  const calendarPopover =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            aria-label="Выберите дату"
            className={styles.popover}
            data-datepicker-popover
            id={dialogId}
            role="dialog"
            style={popoverStyle ?? { visibility: "hidden" }}
          >
            <div className={styles.calendarHead}>
              <button
                aria-label={
                  viewMode === "day"
                    ? "Предыдущий месяц"
                    : viewMode === "month"
                      ? "Предыдущий год"
                      : "Предыдущие годы"
                }
                className={styles.iconButton}
                disabled={
                  viewMode === "day"
                    ? !canMoveMonth(-1)
                    : viewMode === "month"
                      ? viewYear <= minYear
                      : yearPageStart <= getYearPageStart(minYear)
                }
                type="button"
                onClick={() =>
                  viewMode === "day"
                    ? moveMonth(-1)
                    : viewMode === "month"
                      ? moveMonthPickerYear(-1)
                      : moveYearPage(-1)
                }
              >
                <ChevronLeft aria-hidden size={20} />
              </button>

              <div className={styles.headingControls}>
                {viewMode === "day" ? (
                  <>
                    <button
                      className={styles.headingButton}
                      type="button"
                      onClick={() => setViewMode("month")}
                    >
                      {monthNames[viewMonth]}
                    </button>
                    <button
                      className={styles.headingButton}
                      type="button"
                      onClick={() => setViewMode("year")}
                    >
                      {viewYear}
                    </button>
                  </>
                ) : (
                  <button
                    className={styles.headingButton}
                    type="button"
                    onClick={() => setViewMode(viewMode === "month" ? "year" : "day")}
                  >
                    {viewMode === "month" ? viewYear : `${yearPageStart} - ${yearPageStart + 11}`}
                  </button>
                )}
              </div>

              <button
                aria-label={
                  viewMode === "day"
                    ? "Следующий месяц"
                    : viewMode === "month"
                      ? "Следующий год"
                      : "Следующие годы"
                }
                className={styles.iconButton}
                disabled={
                  viewMode === "day"
                    ? !canMoveMonth(1)
                    : viewMode === "month"
                      ? viewYear >= resolvedMaxYear
                      : yearPageStart >= getYearPageStart(resolvedMaxYear)
                }
                type="button"
                onClick={() =>
                  viewMode === "day"
                    ? moveMonth(1)
                    : viewMode === "month"
                      ? moveMonthPickerYear(1)
                      : moveYearPage(1)
                }
              >
                <ChevronRight aria-hidden size={20} />
              </button>
            </div>

            <div className={styles.calendarBody}>
              {viewMode === "day" ? (
                <>
                  <div className={styles.weekdays}>
                    {weekdayNames.map((weekday) => (
                      <span key={weekday}>{weekday}</span>
                    ))}
                  </div>

                  <div className={styles.days}>
                    {days.map((day, index) =>
                      day ? (
                        <button
                          aria-pressed={isSelectedDay(day)}
                          className={styles.day}
                          data-range={getDayRangeState(day)}
                          disabled={isDisabledDay(day)}
                          key={`${viewYear}-${viewMonth}-${day}`}
                          type="button"
                          onClick={() => selectDay(day)}
                        >
                          {day}
                        </button>
                      ) : (
                        <span aria-hidden className={styles.emptyDay} key={`empty-${index}`} />
                      ),
                    )}
                  </div>
                </>
              ) : null}

              {viewMode === "month" ? (
                <div className={styles.pickerGrid}>
                  {shortMonthNames.map((month, index) => (
                    <button
                      aria-pressed={index === viewMonth}
                      className={styles.pickerOption}
                      disabled={isDisabledMonth(viewYear, index)}
                      key={month}
                      type="button"
                      onClick={() => selectMonth(index)}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              ) : null}

              {viewMode === "year" ? (
                <div className={styles.pickerGrid}>
                  {yearOptions.map((year) => (
                    <button
                      aria-pressed={year === viewYear}
                      className={styles.pickerOption}
                      disabled={isDisabledYear(year)}
                      key={year}
                      type="button"
                      onClick={() => selectYear(year)}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={cn(styles.field, error && styles.invalid, className)}>
      {label ? (
        <label className={styles.label} htmlFor={inputId} id={labelId}>
          {label}
        </label>
      ) : null}

      <input
        tabIndex={-1}
        aria-hidden
        className={styles.hiddenInput}
        id={inputId}
        max={max}
        min={min}
        name={name}
        required={required}
        type={mode === "range" ? "text" : "date"}
        value={
          mode === "range"
            ? [rangeValue?.from, rangeValue?.to].filter(Boolean).join("/")
            : (value ?? "")
        }
        onChange={(event) => {
          if (mode === "single") {
            onChange?.(event.target.value);
          }
        }}
      />

      <button
        ref={triggerRef}
        aria-controls={dialogId}
        aria-describedby={errorId}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-labelledby={labelId ? `${labelId} ${valueId}` : valueId}
        className={cn(
          styles.trigger,
          triggerSizeClassName[size],
          variant === "filter" && styles.triggerFilter,
        )}
        data-variant={variant}
        disabled={disabled}
        type="button"
        onClick={handleTriggerClick}
      >
        <CalendarDays aria-hidden className={styles.leadingIcon} size={21} strokeWidth={2} />
        <span className={cn(styles.value, !displayValue && styles.placeholder)} id={valueId}>
          {displayValue ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(styles.chevron, open && styles.chevronOpen)}
          size={20}
          strokeWidth={2.1}
        />
      </button>

      {calendarPopover}

      {error ? (
        <span className={styles.error} id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
