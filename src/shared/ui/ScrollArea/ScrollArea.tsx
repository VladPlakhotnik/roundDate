"use client";

import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

import styles from "./ScrollArea.module.css";

export type ScrollAreaProps = HTMLAttributes<HTMLDivElement>;

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn(styles.root, className)} {...props}>
      {children}
    </div>
  ),
);

ScrollArea.displayName = "ScrollArea";
