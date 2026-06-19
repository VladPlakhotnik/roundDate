"use client";

import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ForwardedRef } from "react";

import { cn } from "@/shared/lib/cn";

import styles from "./Button.module.css";
import { buttonVariants } from "./Button.styles";
import type { ButtonProps } from "./Button.types";

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    if (props.as === "link") {
      const {
        as,
        children,
        className,
        disabled,
        fullWidth,
        href,
        isLoading = false,
        leftIcon,
        rightIcon,
        size,
        variant,
        ...anchorProps
      } = props;
      void as;

      const isDisabled = disabled || isLoading;

      return (
        <a
          ref={ref as ForwardedRef<HTMLAnchorElement>}
          aria-busy={isLoading || undefined}
          aria-disabled={isDisabled || undefined}
          data-disabled={isDisabled || undefined}
          href={isDisabled ? undefined : href}
          className={cn(buttonVariants({ fullWidth, size, variant }), className)}
          {...anchorProps}
        >
          {isLoading ? <span aria-hidden className={styles.spinner} /> : null}
          <span className={cn(styles.content, isLoading && styles.loadingText)}>
            {leftIcon ? <span className={styles.iconSlot}>{leftIcon}</span> : null}
            {children}
            {rightIcon ? <span className={styles.iconSlot}>{rightIcon}</span> : null}
          </span>
        </a>
      );
    }

    const {
      as,
      asChild = false,
      children,
      className,
      disabled,
      fullWidth,
      isLoading = false,
      leftIcon,
      rightIcon,
      size,
      type = "button",
      variant,
      ...buttonProps
    } = props;
    void as;

    const isDisabled = disabled || isLoading;
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref as ForwardedRef<HTMLButtonElement>}
        aria-busy={isLoading || undefined}
        data-disabled={isDisabled || undefined}
        disabled={!asChild ? isDisabled : undefined}
        type={!asChild ? type : undefined}
        className={cn(buttonVariants({ fullWidth, size, variant }), className)}
        {...buttonProps}
      >
        {isLoading ? <span aria-hidden className={styles.spinner} /> : null}
        <span className={cn(styles.content, isLoading && styles.loadingText)}>
          {leftIcon ? <span className={styles.iconSlot}>{leftIcon}</span> : null}
          {children}
          {rightIcon ? <span className={styles.iconSlot}>{rightIcon}</span> : null}
        </span>
      </Comp>
    );
  },
);

Button.displayName = "Button";
