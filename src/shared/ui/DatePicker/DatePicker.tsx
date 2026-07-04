"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useI18n } from "@/shared/i18n/I18nProvider";
import { cn } from "@/shared/lib/cn";
import { useFloatingPopover, type FloatingPopoverStyle } from "@/shared/hooks/useFloatingPopover";

import styles from "./DatePicker.module.css";

export type DatePickerProps = {
  className?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  kind?: DatePickerKind;
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
type DatePickerKind = "date" | "time" | "datetime";
type TimePart = "hour" | "minute";

function createMonthNames(locale: string, format: "long" | "short") {
  const formatter = new Intl.DateTimeFormat(locale, { month: format });

  return Array.from({ length: 12 }, (_, index) => formatter.format(new Date(2026, index, 1)));
}

function createWeekdayNames(locale: string) {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const monday = new Date(2026, 0, 5);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);

    date.setDate(monday.getDate() + index);

    return formatter.format(date);
  });
}

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

function normalizeTime(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);

  if (!match) {
    return undefined;
  }

  return `${match[1]}:${match[2]}`;
}

function getDateTimeParts(value: string | undefined) {
  if (!value) {
    return { date: undefined, time: undefined };
  }

  const [datePart, timePart = ""] = value.split("T");

  return {
    date: parseDate(datePart) ? datePart : undefined,
    time: normalizeTime(timePart.slice(0, 5)),
  };
}

function formatDateTimeInput(value: string | undefined) {
  const { date, time } = getDateTimeParts(value);

  if (!date || !time) {
    return "";
  }

  return `${date}T${time}`;
}

function formatDisplayDate(value: string | undefined, locale: string) {
  const date = parseDate(value);

  if (!date) {
    return undefined;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDisplayTime(value: string | undefined) {
  return normalizeTime(value);
}

function formatDisplayDateTime(value: string | undefined, locale: string) {
  const { date, time } = getDateTimeParts(value);
  const displayDate = formatDisplayDate(date, locale);

  if (displayDate && time) {
    return `${displayDate}, ${time}`;
  }

  return displayDate ?? time;
}

function clampTimePart(value: string, max: number) {
  const numericValue = Number(value.replace(/\D/g, ""));

  if (!Number.isFinite(numericValue)) {
    return "00";
  }

  return String(Math.min(Math.max(numericValue, 0), max)).padStart(2, "0");
}

function formatDisplayRange(value: DateRangeValue | undefined, locale: string) {
  const from = formatDisplayDate(value?.from, locale);
  const to = formatDisplayDate(value?.to, locale);

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

function getScopedPopoverStyle(style: FloatingPopoverStyle | null, container: HTMLElement | null) {
  if (!style || !container || container === document.body) {
    return style;
  }

  const containerRect = container.getBoundingClientRect();
  const nextStyle: FloatingPopoverStyle = { ...style };

  if (typeof nextStyle.left === "number") {
    nextStyle.left = nextStyle.left - containerRect.left;
  }

  if (typeof nextStyle.top === "number") {
    nextStyle.top = nextStyle.top - containerRect.top;
    delete nextStyle.bottom;
  }

  if (typeof nextStyle.bottom === "number") {
    nextStyle.bottom = nextStyle.bottom + containerRect.bottom - window.innerHeight;
    delete nextStyle.top;
  }

  return nextStyle;
}

export function DatePicker({
  className,
  disabled,
  error,
  id,
  kind = "date",
  label,
  max,
  maxYear,
  min,
  minYear = 1940,
  mode = "single",
  name,
  onChange,
  onRangeChange,
  placeholder,
  rangeValue,
  required,
  size = "md",
  value,
  variant = "default",
}: DatePickerProps) {
  const { locale, t } = useI18n();
  const dateLocale = locale === "en" ? "en-US" : "pl-PL";
  const monthNames = createMonthNames(dateLocale, "long");
  const shortMonthNames = createMonthNames(dateLocale, "short");
  const weekdayNames = createWeekdayNames(dateLocale);
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
  const calendarValue = kind === "datetime" ? getDateTimeParts(value).date : value;
  const timeValue = kind === "datetime" ? getDateTimeParts(value).time : normalizeTime(value);
  const resolvedMaxYear = maxYear ?? today.getFullYear();
  const selectedDate = kind === "time" ? undefined : parseDate(calendarValue);
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
  const [focusedTimePart, setFocusedTimePart] = useState<TimePart | null>(null);
  const [timePartDrafts, setTimePartDrafts] = useState<Partial<Record<TimePart, string>>>({});
  const [popoverContainer, setPopoverContainer] = useState<HTMLElement | null>(null);
  const displayValue =
    kind === "time"
      ? formatDisplayTime(value)
      : kind === "datetime"
        ? formatDisplayDateTime(value, dateLocale)
        : mode === "range"
          ? formatDisplayRange(rangeValue, dateLocale)
          : formatDisplayDate(value, dateLocale);
  const resolvedPlaceholder =
    placeholder ??
    (kind === "time"
      ? t("common.datePicker.time")
      : kind === "datetime"
        ? t("common.datePicker.dateTime")
        : t("common.datePicker.date"));
  const popoverStyle = useFloatingPopover(open, triggerRef, {
    estimatedHeight: kind === "datetime" ? 482 : kind === "time" ? 248 : 392,
    maxWidth: 372,
    minWidth: kind === "time" ? 300 : 336,
    preferredWidth: 372,
  });
  const triggerSizeClassName = {
    sm: styles.triggerSm,
    md: styles.triggerMd,
    lg: styles.triggerLg,
    xl: styles.triggerXl,
  };
  const [resolvedHour = "19", resolvedMinute = "00"] = (timeValue ?? "19:00").split(":");
  const hourInputValue =
    focusedTimePart === "hour" && timePartDrafts.hour !== undefined
      ? timePartDrafts.hour
      : resolvedHour;
  const minuteInputValue =
    focusedTimePart === "minute" && timePartDrafts.minute !== undefined
      ? timePartDrafts.minute
      : resolvedMinute;

  const handleRootRef = useCallback((node: HTMLDivElement | null) => {
    rootRef.current = node;

    if (typeof document === "undefined" || !node) {
      setPopoverContainer(null);
      return;
    }

    setPopoverContainer((node.closest('[role="dialog"]') as HTMLElement | null) ?? document.body);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
        setFocusedTimePart(null);
        setTimePartDrafts({});
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setFocusedTimePart(null);
        setTimePartDrafts({});
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closePicker() {
    setOpen(false);
    setFocusedTimePart(null);
    setTimePartDrafts({});
  }

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

    if (kind === "datetime") {
      onChange?.(`${nextValue}T${timeValue ?? "19:00"}`);
      return;
    }

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

      closePicker();
      return;
    }

    onChange?.(nextValue);
    closePicker();
  }

  function updateTime(nextValue: string) {
    const nextTime = normalizeTime(nextValue);

    if (!nextTime) {
      return;
    }

    if (kind === "time") {
      onChange?.(nextTime);
      return;
    }

    const datePart =
      getDateTimeParts(value).date ?? formatDate(selectedDate ?? new Date(viewYear, viewMonth, 1));

    onChange?.(`${datePart}T${nextTime}`);
  }

  function updateTimePart(part: TimePart, nextValue: string) {
    const currentTime = timeValue ?? "19:00";
    const [currentHour = "19", currentMinute = "00"] = currentTime.split(":");
    const nextHour = part === "hour" ? clampTimePart(nextValue, 23) : currentHour;
    const nextMinute = part === "minute" ? clampTimePart(nextValue, 59) : currentMinute;

    updateTime(`${nextHour}:${nextMinute}`);
  }

  function focusTimePart(part: TimePart, input: HTMLInputElement) {
    setFocusedTimePart(part);
    setTimePartDrafts((current) => ({ ...current, [part]: input.value }));
    input.select();
  }

  function changeTimePart(part: TimePart, nextValue: string) {
    const digits = nextValue.replace(/\D/g, "").slice(0, 2);

    setTimePartDrafts((current) => ({ ...current, [part]: digits }));

    if (digits.length === 2) {
      updateTimePart(part, digits);
    }
  }

  function commitTimePart(part: TimePart) {
    const draft = timePartDrafts[part];

    setFocusedTimePart((current) => (current === part ? null : current));
    setTimePartDrafts((current) => {
      const next = { ...current };
      delete next[part];
      return next;
    });

    if (draft) {
      updateTimePart(part, draft);
    }
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
    if (open) {
      closePicker();
      return;
    }

    const nextSelectedDate =
      mode === "range" ? (parseDate(rangeValue?.from) ?? parseDate(rangeValue?.to)) : selectedDate;
    const nextYear = clampYear(
      nextSelectedDate?.getFullYear() ?? today.getFullYear() - 30,
      minYear,
      resolvedMaxYear,
    );

    setViewMode("day");
    setViewYear(nextYear);
    setViewMonth(nextSelectedDate?.getMonth() ?? 0);
    setYearPageStart(getYearPageStart(nextYear));
    setOpen(true);
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

  const scopedPopoverStyle = getScopedPopoverStyle(popoverStyle, popoverContainer);
  const calendarPopover =
    open && popoverContainer
      ? createPortal(
          <div
            ref={popoverRef}
            aria-label={
              kind === "time"
                ? t("common.datePicker.selectTime")
                : kind === "datetime"
                  ? t("common.datePicker.selectDateTime")
                  : t("common.datePicker.selectDate")
            }
            className={styles.popover}
            data-datepicker-popover
            id={dialogId}
            role="dialog"
            style={scopedPopoverStyle ?? { visibility: "hidden" }}
          >
            {kind !== "time" ? (
              <>
                <div className={styles.calendarHead}>
                  <button
                    aria-label={
                      viewMode === "day"
                        ? t("common.datePicker.previousMonth")
                        : viewMode === "month"
                          ? t("common.datePicker.previousYear")
                          : t("common.datePicker.previousYears")
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
                        {viewMode === "month"
                          ? viewYear
                          : `${yearPageStart} - ${yearPageStart + 11}`}
                      </button>
                    )}
                  </div>

                  <button
                    aria-label={
                      viewMode === "day"
                        ? t("common.datePicker.nextMonth")
                        : viewMode === "month"
                          ? t("common.datePicker.nextYear")
                          : t("common.datePicker.nextYears")
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
              </>
            ) : null}

            {kind !== "date" && mode !== "range" ? (
              <div className={cn(styles.timePanel, kind === "time" && styles.timePanelOnly)}>
                <div className={styles.timeField}>
                  <span>{t("common.datePicker.exactTime")}</span>
                  <div className={styles.timeInputs}>
                    <label>
                      <span>{t("common.datePicker.hour")}</span>
                      <input
                        aria-label={t("common.datePicker.hour")}
                        inputMode="numeric"
                        maxLength={2}
                        type="text"
                        value={hourInputValue}
                        onBlur={() => commitTimePart("hour")}
                        onChange={(event) => changeTimePart("hour", event.currentTarget.value)}
                        onClick={(event) => focusTimePart("hour", event.currentTarget)}
                        onFocus={(event) => focusTimePart("hour", event.currentTarget)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitTimePart("hour");
                            event.currentTarget.blur();
                          }
                        }}
                      />
                    </label>
                    <b aria-hidden>:</b>
                    <label>
                      <span>{t("common.datePicker.minute")}</span>
                      <input
                        aria-label={t("common.datePicker.minute")}
                        inputMode="numeric"
                        maxLength={2}
                        type="text"
                        value={minuteInputValue}
                        onBlur={() => commitTimePart("minute")}
                        onChange={(event) => changeTimePart("minute", event.currentTarget.value)}
                        onClick={(event) => focusTimePart("minute", event.currentTarget)}
                        onFocus={(event) => focusTimePart("minute", event.currentTarget)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitTimePart("minute");
                            event.currentTarget.blur();
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : null}
          </div>,
          popoverContainer,
        )
      : null;

  return (
    <div ref={handleRootRef} className={cn(styles.field, error && styles.invalid, className)}>
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
        type={
          kind === "time"
            ? "text"
            : kind === "datetime"
              ? "datetime-local"
              : mode === "range"
                ? "text"
                : "date"
        }
        value={
          kind === "time"
            ? (timeValue ?? "")
            : kind === "datetime"
              ? formatDateTimeInput(value)
              : mode === "range"
                ? [rangeValue?.from, rangeValue?.to].filter(Boolean).join("/")
                : (value ?? "")
        }
        onChange={(event) => {
          if (kind === "date" && mode === "single") {
            onChange?.(event.target.value);
            return;
          }

          if (kind === "time" || kind === "datetime") {
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
        data-picker-kind={kind}
        data-variant={variant}
        disabled={disabled}
        type="button"
        onClick={handleTriggerClick}
      >
        {kind === "time" ? (
          <Clock3 aria-hidden className={styles.leadingIcon} size={21} strokeWidth={2} />
        ) : (
          <CalendarDays aria-hidden className={styles.leadingIcon} size={21} strokeWidth={2} />
        )}
        <span className={cn(styles.value, !displayValue && styles.placeholder)} id={valueId}>
          {displayValue ?? resolvedPlaceholder}
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
