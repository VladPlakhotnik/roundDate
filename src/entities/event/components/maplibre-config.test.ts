import { describe, expect, it, vi } from "vitest";

import {
  addEventMap3dBuildings,
  EVENT_MAP_STYLE,
  EVENT_MAP_STYLE_URL,
  OPENFREEMAP_VECTOR_SOURCE_URL,
} from "./maplibre-config";

describe("event maplibre config", () => {
  it("uses OpenFreeMap vector style so native MapLibre attribution is visible", () => {
    expect(EVENT_MAP_STYLE_URL).toBe("https://tiles.openfreemap.org/styles/liberty");
    expect(EVENT_MAP_STYLE).toBe(EVENT_MAP_STYLE_URL);
  });

  it("adds real vector building extrusions from OpenFreeMap", () => {
    const map = {
      addLayer: vi.fn(),
      addSource: vi.fn(),
      getLayer: vi.fn(() => undefined),
      getSource: vi.fn(() => undefined),
      getStyle: vi.fn(() => ({
        layers: [{ id: "labels", layout: { "text-field": ["get", "name"] }, type: "symbol" }],
      })),
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
    };

    addEventMap3dBuildings(map as never, [[18.6533, 54.3464]], {
      id: "events-list-buildings",
    });

    expect(map.addSource).toHaveBeenCalledWith("openfreemap", {
      type: "vector",
      url: OPENFREEMAP_VECTOR_SOURCE_URL,
    });
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "events-list-buildings",
        source: "openfreemap",
        "source-layer": "building",
        type: "fill-extrusion",
      }),
      "labels",
    );
  });
});
