"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

import styles from "./Switch.module.css";

export type SwitchSize = "sm" | "md";

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "role"> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: SwitchSize;
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    { checked, className, onCheckedChange, onClick, size = "md", type = "button", ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        aria-checked={checked}
        className={cn(styles.root, styles[size], className)}
        data-active={checked}
        role="switch"
        type={type}
        onClick={(event) => {
          onClick?.(event);

          if (!event.defaultPrevented) {
            onCheckedChange?.(!checked);
          }
        }}
        {...props}
      >
        <span aria-hidden className={styles.thumb} />
      </button>
    );
  },
);

Switch.displayName = "Switch";
