import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import styles from "@/shared/ui/Badge/Badge.module.css";

export type AdminBadgeTone = "danger" | "success" | "warning" | "info" | "neutral";
export type AdminBadgeSize = "sm" | "md";

type AdminBadgeProps = {
  children: ReactNode;
  className?: string | undefined;
  leftIcon?: ReactNode | undefined;
  size?: AdminBadgeSize;
  tone?: AdminBadgeTone;
};

const toneClassName = {
  danger: styles.danger,
  info: styles.info,
  neutral: styles.neutral,
  success: styles.success,
  warning: styles.warning,
} satisfies Record<AdminBadgeTone, string | undefined>;

const sizeClassName = {
  md: styles.md,
  sm: styles.sm,
} satisfies Record<AdminBadgeSize, string | undefined>;

export function AdminBadge({
  children,
  className,
  leftIcon,
  size = "md",
  tone = "neutral",
}: AdminBadgeProps) {
  return (
    <span className={cn(styles.root, toneClassName[tone], sizeClassName[size], className)}>
      {leftIcon}
      <span>{children}</span>
    </span>
  );
}
