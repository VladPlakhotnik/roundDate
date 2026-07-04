"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";

import {
  addEventMap3dBuildings,
  bindEventAttributionControl,
  bindMissingMapStyleImages,
  createCollapsedEventAttributionControl,
  EVENT_MAP_DEFAULT_VIEW,
  EVENT_MAP_STYLE,
} from "@/entities/event/components/maplibre-config";
import { cn } from "@/shared/lib/cn";

import styles from "./Map.module.css";

export type MapPoint = {
  latitude: number;
  longitude: number;
};

export type MapMarkerOptions = {
  className?: string | undefined;
  point: MapPoint;
};

type MapProps = {
  bearing?: number;
  buildingsId?: string;
  buildingsScale?: number;
  className?: string | undefined;
  marker?: MapMarkerOptions;
  onClick?: (point: MapPoint) => void;
  pitch?: number;
  view: MapPoint;
  zoom?: number;
};

export function Map({
  bearing = EVENT_MAP_DEFAULT_VIEW.bearing,
  buildingsId = "shared-map-buildings",
  buildingsScale = 1.25,
  className,
  marker,
  onClick,
  pitch = EVENT_MAP_DEFAULT_VIEW.pitch,
  view,
  zoom = 13.7,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onClickRef = useRef(onClick);
  const markerLatitude = marker?.point.latitude;
  const markerLongitude = marker?.point.longitude;

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    let disposed = false;
    let unbindAttribution: (() => void) | undefined;
    let unbindMissingImages: (() => void) | undefined;

    async function initMap() {
      const maplibregl = await import("maplibre-gl");

      if (disposed || !containerRef.current) {
        return;
      }

      const map = new maplibregl.Map({
        attributionControl: false,
        bearing,
        canvasContextAttributes: { antialias: true },
        center: [view.longitude, view.latitude],
        container: containerRef.current,
        logoPosition: "bottom-left",
        maplibreLogo: true,
        maxPitch: 72,
        pitch,
        style: EVENT_MAP_STYLE,
        zoom,
      });

      mapRef.current = map;
      unbindMissingImages = bindMissingMapStyleImages(map);
      map.addControl(
        createCollapsedEventAttributionControl(maplibregl.AttributionControl),
        "bottom-right",
      );
      unbindAttribution = bindEventAttributionControl(map, containerRef.current);

      if (marker) {
        const markerNode = document.createElement("span");
        markerNode.className = marker.className ?? "";
        markerRef.current = new maplibregl.Marker({
          anchor: "bottom",
          element: markerNode,
        })
          .setLngLat([marker.point.longitude, marker.point.latitude])
          .addTo(map);
      }

      map.on("click", (event) => {
        onClickRef.current?.({
          latitude: Number(event.lngLat.lat.toFixed(5)),
          longitude: Number(event.lngLat.lng.toFixed(5)),
        });
      });

      map.once("load", () => {
        if (!mapRef.current || disposed) {
          return;
        }

        addEventMap3dBuildings(mapRef.current, [[view.longitude, view.latitude]], {
          height: 42,
          id: buildingsId,
          scale: buildingsScale,
        });
        mapRef.current.resize();
      });
    }

    void initMap();

    return () => {
      disposed = true;
      unbindAttribution?.();
      unbindMissingImages?.();
      markerRef.current?.remove();
      mapRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
    // MapLibre is initialized once. View and marker updates are handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.easeTo({
      center: [view.longitude, view.latitude],
      duration: 420,
    });
  }, [view.latitude, view.longitude]);

  useEffect(() => {
    if (markerLatitude === undefined || markerLongitude === undefined) {
      return;
    }

    markerRef.current?.setLngLat([markerLongitude, markerLatitude]);
  }, [markerLatitude, markerLongitude]);

  return <div className={cn(styles.map, className)} ref={containerRef} />;
}
