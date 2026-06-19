"use client";

import type { CSSProperties } from "react";

import { cn } from "@/shared/lib/cn";

import styles from "./RangeSlider.module.css";

export type RangeSliderValue = {
  from: number;
  to: number;
};

export type RangeSliderProps = {
  className?: string;
  disabled?: boolean;
  formatValue?: (value: number) => string;
  label: string;
  max: number;
  min: number;
  onChange: (value: RangeSliderValue) => void;
  step?: number;
  value: RangeSliderValue;
};

function normalizeRange(nextValue: RangeSliderValue): RangeSliderValue {
  return nextValue.from <= nextValue.to ? nextValue : { from: nextValue.to, to: nextValue.from };
}

export function RangeSlider({
  className,
  disabled,
  formatValue = String,
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
}: RangeSliderProps) {
  const clampedFrom = Math.min(Math.max(value.from, min), max);
  const clampedTo = Math.min(Math.max(value.to, min), max);
  const fromPercent = ((clampedFrom - min) / (max - min)) * 100;
  const toPercent = ((clampedTo - min) / (max - min)) * 100;

  function emit(nextValue: RangeSliderValue) {
    onChange(normalizeRange(nextValue));
  }

  return (
    <div className={cn(styles.root, className)} data-disabled={disabled || undefined}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>
          <span>{formatValue(clampedFrom)}</span>
          <span aria-hidden> - </span>
          <span>{formatValue(clampedTo)}</span>
        </span>
      </div>

      <div
        className={styles.track}
        style={
          {
            "--range-from": `${Math.min(fromPercent, toPercent)}%`,
            "--range-to": `${Math.max(fromPercent, toPercent)}%`,
          } as CSSProperties
        }
      >
        <input
          aria-label={`${label} от`}
          className={cn(styles.input, styles.inputFrom)}
          disabled={disabled}
          max={max}
          min={min}
          step={step}
          type="range"
          value={clampedFrom}
          onChange={(event) => emit({ from: Number(event.currentTarget.value), to: clampedTo })}
        />
        <input
          aria-label={`${label} до`}
          className={cn(styles.input, styles.inputTo)}
          disabled={disabled}
          max={max}
          min={min}
          step={step}
          type="range"
          value={clampedTo}
          onChange={(event) => emit({ from: clampedFrom, to: Number(event.currentTarget.value) })}
        />
      </div>
    </div>
  );
}
