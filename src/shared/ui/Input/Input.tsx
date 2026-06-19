"use client";

import { forwardRef, useId } from "react";

import { cn } from "@/shared/lib/cn";

import styles from "./Input.module.css";
import type { InputProps } from "./Input.types";

const inputSizeClassName = {
  sm: styles.inputSm,
  md: styles.inputMd,
  lg: styles.inputLg,
  xl: styles.inputXl,
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      controlClassName,
      error,
      fieldClassName,
      hint,
      id,
      inputClassName,
      label,
      labelAction,
      labelClassName,
      leftIcon,
      rightIcon,
      size = "md",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy =
      [props["aria-describedby"], errorId, hintId].filter(Boolean).join(" ") || undefined;

    return (
      <label
        className={cn(
          styles.field,
          error && styles.invalid,
          leftIcon && styles.hasLeftIcon,
          rightIcon && styles.hasRightIcon,
          fieldClassName,
          className,
        )}
        htmlFor={inputId}
      >
        {label || labelAction ? (
          <span className={styles.labelRow}>
            {label ? <span className={cn(styles.label, labelClassName)}>{label}</span> : null}
            {labelAction}
          </span>
        ) : null}

        <span className={cn(styles.control, controlClassName)}>
          {leftIcon ? <span className={cn(styles.icon, styles.leftIcon)}>{leftIcon}</span> : null}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : props["aria-invalid"]}
            {...(describedBy ? { "aria-describedby": describedBy } : {})}
            className={cn(styles.input, inputSizeClassName[size], inputClassName)}
            {...props}
          />
          {rightIcon ? (
            <span className={cn(styles.icon, styles.rightIcon)}>{rightIcon}</span>
          ) : null}
        </span>

        {error ? (
          <span className={styles.error} id={errorId} role="alert">
            {error}
          </span>
        ) : null}
        {hint ? (
          <span className={styles.hint} id={hintId}>
            {hint}
          </span>
        ) : null}
      </label>
    );
  },
);

Input.displayName = "Input";
