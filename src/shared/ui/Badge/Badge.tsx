import { CheckCircle2, Clock3, Hourglass, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import styles from "./Badge.module.css";

export type BadgeStatus = "confirmed" | "payment-pending" | "waitlist";
export type BadgeTone = "success" | "warning" | "info" | "neutral";
export type BadgeSize = "sm" | "md";

type StatusConfig = {
  icon: LucideIcon;
  label: string;
  tone: BadgeTone;
};

export type BadgeProps = {
  children?: ReactNode;
  className?: string;
  leftIcon?: ReactNode;
  size?: BadgeSize;
  status?: BadgeStatus;
  tone?: BadgeTone;
};

const statusConfig = {
  confirmed: {
    icon: CheckCircle2,
    label: "Запись подтверждена",
    tone: "success",
  },
  "payment-pending": {
    icon: Clock3,
    label: "Ожидает оплаты",
    tone: "warning",
  },
  waitlist: {
    icon: Hourglass,
    label: "Запись в листе ожидания",
    tone: "info",
  },
} satisfies Record<BadgeStatus, StatusConfig>;

const toneClassName = {
  info: styles.info,
  neutral: styles.neutral,
  success: styles.success,
  warning: styles.warning,
} satisfies Record<BadgeTone, string | undefined>;

const sizeClassName = {
  md: styles.md,
  sm: styles.sm,
} satisfies Record<BadgeSize, string | undefined>;

export function Badge({
  children,
  className,
  leftIcon,
  size = "md",
  status,
  tone = "neutral",
}: BadgeProps) {
  const config = status ? statusConfig[status] : undefined;
  const Icon = config?.icon;
  const content = children ?? config?.label;
  const resolvedTone = config?.tone ?? tone;

  return (
    <span className={cn(styles.root, toneClassName[resolvedTone], sizeClassName[size], className)}>
      {leftIcon ?? (Icon ? <Icon aria-hidden size={size === "sm" ? 15 : 18} /> : null)}
      {content ? <span>{content}</span> : null}
    </span>
  );
}
