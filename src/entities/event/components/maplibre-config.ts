import type {
  Map as MapLibreMap,
  MapStyleImageMissingEvent,
  StyleSpecification,
} from "maplibre-gl";

export const EVENT_MAP_DEFAULT_VIEW = {
  bearing: -28,
  pitch: 64,
} as const;

export const EVENT_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
export const OPENFREEMAP_VECTOR_SOURCE_ID = "openfreemap";
export const OPENFREEMAP_VECTOR_SOURCE_URL = "https://tiles.openfreemap.org/planet";
export const EVENT_MAP_STYLE = EVENT_MAP_STYLE_URL;

export function addEventMap3dBuildings(
  map: MapLibreMap,
  _markers: Array<readonly [number, number]>,
  options?: { height?: number; id?: string; scale?: number },
) {
  const layerId = options?.id ?? "event-buildings";

  if (map.getLayer(layerId)) {
    return;
  }

  if (!map.getSource(OPENFREEMAP_VECTOR_SOURCE_ID)) {
    map.addSource(OPENFREEMAP_VECTOR_SOURCE_ID, {
      type: "vector",
      url: OPENFREEMAP_VECTOR_SOURCE_URL,
    });
  }

  const layers = map.getStyle().layers ?? [];
  const labelLayer = layers.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"]);

  map.addLayer(
    {
      id: layerId,
      filter: ["!=", ["get", "hide_3d"], true],
      minzoom: 14,
      paint: {
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          0,
          15,
          ["to-number", ["get", "render_min_height"], 0],
        ],
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          ["to-number", ["get", "render_height"], 0],
          0,
          "#e3dfd8",
          80,
          "#c9c4bd",
          220,
          "#9f9990",
        ],
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          0,
          15,
          ["to-number", ["get", "render_height"], 0],
        ],
        "fill-extrusion-opacity": 0.76,
        "fill-extrusion-vertical-gradient": true,
      },
      source: OPENFREEMAP_VECTOR_SOURCE_ID,
      "source-layer": "building",
      type: "fill-extrusion",
    },
    labelLayer?.id,
  );
}

export function bindMissingMapStyleImages(map: MapLibreMap) {
  const handleStyleImageMissing = (event: MapStyleImageMissingEvent) => {
    if (!event.id || map.hasImage(event.id)) {
      return;
    }

    try {
      map.addImage(event.id, {
        data: new Uint8Array(4),
        height: 1,
        width: 1,
      });
    } catch {
      // MapLibre can request the same style icon more than once while the style settles.
    }
  };

  map.on("styleimagemissing", handleStyleImageMissing);

  return () => {
    map.off("styleimagemissing", handleStyleImageMissing);
  };
}

export type EventMapStyle = string | StyleSpecification;
