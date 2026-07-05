"use client";

import {
  Ban,
  CheckCircle2,
  Clock3,
  Hourglass,
  RotateCcw,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { useI18n } from "@/shared/i18n/I18nProvider";
import { cn } from "@/shared/lib/cn";

import styles from "./Badge.module.css";

export type BadgeStatus =
  | "attended"
  | "cancelled"
  | "confirmed"
  | "no-show"
  | "payment-pending"
  | "refunded"
  | "waitlist";
export type BadgeTone = "danger" | "success" | "warning" | "info" | "neutral";
export type BadgeSize = "sm" | "md";

type StatusConfig = {
  icon: LucideIcon;
  labelKey: string;
  tone: BadgeTone;
};

export type BadgeProps = {
  children?: ReactNode;
  className?: string | undefined;
  leftIcon?: ReactNode | undefined;
  size?: BadgeSize;
  status?: BadgeStatus;
  tone?: BadgeTone;
};

const statusConfig = {
  attended: {
    icon: CheckCircle2,
    labelKey: "common.badge.attended",
    tone: "success",
  },
  cancelled: {
    icon: XCircle,
    labelKey: "common.badge.cancelled",
    tone: "neutral",
  },
  confirmed: {
    icon: CheckCircle2,
    labelKey: "common.badge.confirmed",
    tone: "success",
  },
  "no-show": {
    icon: Ban,
    labelKey: "common.badge.noShow",
    tone: "warning",
  },
  "payment-pending": {
    icon: Clock3,
    labelKey: "common.badge.paymentPending",
    tone: "warning",
  },
  refunded: {
    icon: RotateCcw,
    labelKey: "common.badge.refunded",
    tone: "info",
  },
  waitlist: {
    icon: Hourglass,
    labelKey: "common.badge.waitlist",
    tone: "info",
  },
} satisfies Record<BadgeStatus, StatusConfig>;

const toneClassName = {
  danger: styles.danger,
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
  const { t } = useI18n();
  const config = status ? statusConfig[status] : undefined;
  const Icon = config?.icon;
  const content = children ?? (config ? t(config.labelKey) : undefined);
  const resolvedTone = config?.tone ?? tone;

  return (
    <span className={cn(styles.root, toneClassName[resolvedTone], sizeClassName[size], className)}>
      {leftIcon ?? (Icon ? <Icon aria-hidden size={size === "sm" ? 15 : 18} /> : null)}
      {content ? <span>{content}</span> : null}
    </span>
  );
}
