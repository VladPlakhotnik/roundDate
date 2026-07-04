"use client";

import { Map, type MapPoint } from "@/shared/ui/Map";

import styles from "./AdminVenueMapPicker.module.css";

export type AdminVenueMapValue = {
  latitude: number;
  longitude: number;
};

type AdminVenueMapPickerProps = {
  className?: string;
  isInteractive?: boolean;
  label?: string;
  onChange?: (value: AdminVenueMapValue) => void;
  value: AdminVenueMapValue;
};

export function AdminVenueMapPicker({
  className,
  isInteractive = true,
  label = "Точка на карте",
  onChange,
  value,
}: AdminVenueMapPickerProps) {
  function handleClick(point: MapPoint) {
    if (isInteractive) {
      onChange?.(point);
    }
  }

  return (
    <div
      className={[styles.shell, isInteractive && styles.interactive, className]
        .filter(Boolean)
        .join(" ")}
    >
      <Map
        buildingsId="admin-venue-picker-buildings"
        marker={{ className: styles.marker, point: value }}
        view={value}
        {...(isInteractive ? { onClick: handleClick } : {})}
      />
      <div className={styles.label}>
        <strong>{label}</strong>
        <span>
          {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
        </span>
      </div>
    </div>
  );
}
