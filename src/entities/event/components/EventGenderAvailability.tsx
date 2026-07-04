"use client";

import { Mars, Venus } from "lucide-react";

import { useI18n } from "@/shared/i18n/I18nProvider";
import { cn } from "@/shared/lib/cn";

import { splitEventGenderAvailability } from "../model/availability";
import styles from "./EventGenderAvailability.module.css";

type EventGenderAvailabilityProps = {
  className?: string | undefined;
  femaleSpotsAvailable?: number | undefined;
  maleSpotsAvailable?: number | undefined;
  size?: "md" | "sm";
  spotsAvailable: number;
};

export function EventGenderAvailability({
  className,
  femaleSpotsAvailable,
  maleSpotsAvailable,
  size = "md",
  spotsAvailable,
}: EventGenderAvailabilityProps) {
  const { t } = useI18n();
  const fallback = splitEventGenderAvailability(spotsAvailable);
  const female = femaleSpotsAvailable ?? fallback.female;
  const male = maleSpotsAvailable ?? fallback.male;

  return (
    <div
      aria-label={t("event.availability.aria", { female, male })}
      className={cn(styles.root, styles[size], className)}
    >
      <span className={cn(styles.badge, styles.female)}>
        <Venus aria-hidden size={size === "sm" ? 14 : 16} strokeWidth={2.2} />
        {t("event.availability.female")} <strong>{female}</strong>
      </span>
      <span className={cn(styles.badge, styles.male)}>
        <Mars aria-hidden size={size === "sm" ? 14 : 16} strokeWidth={2.2} />
        {t("event.availability.male")} <strong>{male}</strong>
      </span>
    </div>
  );
}
