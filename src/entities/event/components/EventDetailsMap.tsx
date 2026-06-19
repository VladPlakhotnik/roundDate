"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

import {
  addEventMap3dBuildings,
  bindMissingMapStyleImages,
  EVENT_MAP_DEFAULT_VIEW,
  EVENT_MAP_STYLE,
} from "./maplibre-config";
import styles from "./EventDetailsModal.module.css";

export type EventMapLocation = {
  bearing?: number;
  center: readonly [number, number];
  cityLabel: string;
  districtLabel: string;
  marker: readonly [number, number];
  pitch?: number;
  venueAddress: string;
  venueLabel: string;
  zoom?: number;
};

type EventDetailsMapProps = {
  location: EventMapLocation;
};

export function EventDetailsMap({ location }: EventDetailsMapProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);

  useEffect(() => {
    let disposed = false;
    let map: MapLibreMap | null = null;
    let unbindMissingImages: (() => void) | undefined;

    async function initMap() {
      const maplibregl = await import("maplibre-gl");

      if (disposed || !mapNodeRef.current) {
        return;
      }

      map = new maplibregl.Map({
        attributionControl: { compact: true },
        bearing: location.bearing ?? EVENT_MAP_DEFAULT_VIEW.bearing,
        canvasContextAttributes: { antialias: true },
        center: [location.center[0], location.center[1]],
        container: mapNodeRef.current,
        interactive: false,
        logoPosition: "bottom-left",
        maplibreLogo: true,
        maxPitch: 72,
        pitch: location.pitch ?? EVENT_MAP_DEFAULT_VIEW.pitch,
        style: EVENT_MAP_STYLE,
        zoom: location.zoom ?? 15.5,
      });
      unbindMissingImages = bindMissingMapStyleImages(map);

      map.on("error", () => {
        if (!disposed) {
          setMapUnavailable(true);
        }
      });

      map.once("load", () => {
        if (!map || disposed) {
          return;
        }

        addEventMap3dBuildings(map, [location.marker], {
          height: 52,
          id: "event-detail-buildings",
          scale: 1.7,
        });
        mapNodeRef.current?.setAttribute(
          "data-map-3d-ready",
          map.getLayer("event-detail-buildings") ? "true" : "false",
        );
        map.resize();
      });
    }

    void initMap();

    return () => {
      disposed = true;
      unbindMissingImages?.();
      map?.remove();
    };
  }, [location]);

  return (
    <div className={styles.mapShell}>
      <div className={styles.mapCanvas} ref={mapNodeRef} />
      {mapUnavailable ? <div className={styles.mapFallback} aria-hidden /> : null}
      <div className={styles.mapCity}>
        <strong>{location.cityLabel}</strong>
        <span>{location.districtLabel}</span>
      </div>
      <div className={styles.mapPin} aria-hidden />
      <div className={styles.mapVenue}>
        <strong>{location.venueLabel}</strong>
        <span>{location.venueAddress}</span>
      </div>
    </div>
  );
}
