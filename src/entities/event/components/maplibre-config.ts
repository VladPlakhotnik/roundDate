import type {
  IControl,
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

type EventAttributionControlConstructor = new (options: {
  compact?: boolean;
}) => IControl;

export function createCollapsedEventAttributionControl(
  AttributionControl: EventAttributionControlConstructor,
) {
  const attributionControl = new AttributionControl({ compact: true });
  const originalOnAdd = attributionControl.onAdd.bind(attributionControl);

  attributionControl.onAdd = (map) => {
    const control = originalOnAdd(map);

    collapseEventAttributionElement(control);

    return control;
  };

  return attributionControl;
}

export function bindEventAttributionControl(map: MapLibreMap, container: HTMLElement | null) {
  const control = getEventAttributionControl(container);
  const nativeButton = control?.querySelector<HTMLElement>(".maplibregl-ctrl-attrib-button");

  if (!control || !nativeButton) {
    return () => undefined;
  }

  control.dataset.eventAttributionBound = "true";
  nativeButton.setAttribute("aria-expanded", "false");

  const refreshAttributionControl = () => {
    syncDefaultCollapsedEventAttributionControl(container);
  };
  let didHandlePointerDown = false;
  const isEventAttributionControlClick = (event: Event) => {
    const target = event.target instanceof Node ? event.target : null;
    const targetElement = target instanceof Element ? target : target?.parentElement ?? null;

    return !targetElement?.closest("a");
  };
  const toggleEventAttributionControl = (event: Event) => {
    if (!isEventAttributionControlClick(event)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    const nextControl = getEventAttributionControl(container);

    if (!nextControl?.classList.contains("maplibregl-compact")) {
      return;
    }

    if (
      nextControl.dataset.eventAttributionUserOpen === "true" &&
      nextControl.classList.contains("maplibregl-compact-show")
    ) {
      collapseEventAttributionControl(container);
      return;
    }

    nextControl.dataset.eventAttributionUserOpen = "true";
    nextControl.setAttribute("open", "");
    nextControl.classList.add("maplibregl-compact-show");
    setEventAttributionButtonExpanded(nextControl, true);
  };
  const handleEventAttributionPointerDown = (event: Event) => {
    if (!isEventAttributionControlClick(event)) {
      return;
    }

    didHandlePointerDown = true;
    toggleEventAttributionControl(event);
  };
  const handleEventAttributionClick = (event: Event) => {
    if (!didHandlePointerDown) {
      toggleEventAttributionControl(event);
      return;
    }

    didHandlePointerDown = false;

    if (!isEventAttributionControlClick(event)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const observer = new MutationObserver(refreshAttributionControl);

  refreshAttributionControl();
  control.addEventListener("pointerdown", handleEventAttributionPointerDown, true);
  control.addEventListener("click", handleEventAttributionClick, true);
  observer.observe(control, {
    childList: true,
    subtree: true,
  });
  map.on("styledata", refreshAttributionControl);
  map.on("sourcedata", refreshAttributionControl);

  return () => {
    control.removeEventListener("pointerdown", handleEventAttributionPointerDown, true);
    control.removeEventListener("click", handleEventAttributionClick, true);
    nativeButton.removeAttribute("aria-expanded");
    delete control.dataset.eventAttributionBound;
    observer.disconnect();
    map.off("styledata", refreshAttributionControl);
    map.off("sourcedata", refreshAttributionControl);
  };
}

function syncDefaultCollapsedEventAttributionControl(container: HTMLElement | null) {
  const control = getEventAttributionControl(container);

  if (control?.dataset.eventAttributionUserOpen !== "true") {
    collapseEventAttributionControl(container);
  }
}

function collapseEventAttributionControl(container: HTMLElement | null) {
  collapseEventAttributionElement(getEventAttributionControl(container));
}

function collapseEventAttributionElement(control: HTMLElement | null) {
  if (!control?.classList.contains("maplibregl-compact")) {
    return;
  }

  if (control.dataset.eventAttributionUserOpen) {
    delete control.dataset.eventAttributionUserOpen;
  }

  if (control.classList.contains("maplibregl-compact-show")) {
    control.classList.remove("maplibregl-compact-show");
  }

  if (control.hasAttribute("open")) {
    control.removeAttribute("open");
  }

  setEventAttributionButtonExpanded(control, false);
}

function setEventAttributionButtonExpanded(control: HTMLElement, isExpanded: boolean) {
  const button = control.querySelector<HTMLElement>(".maplibregl-ctrl-attrib-button");

  button?.setAttribute("aria-expanded", String(isExpanded));
}

function getEventAttributionControl(container: HTMLElement | null) {
  return container?.querySelector<HTMLElement>(".maplibregl-ctrl-attrib") ?? null;
}

export type EventMapStyle = string | StyleSpecification;
