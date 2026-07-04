import { describe, expect, it } from "vitest";

import { normalizeReverseGeocodeResult } from "./reverse-geocode";

describe("normalizeReverseGeocodeResult", () => {
  it("builds a readable street address from Nominatim data", () => {
    expect(
      normalizeReverseGeocodeResult({
        address: {
          city: "Gdansk",
          house_number: "10",
          road: "Dluga",
          suburb: "Srodmiescie",
        },
        display_name: "Dluga 10, Srodmiescie, Gdansk, Pomeranian Voivodeship, Poland",
        name: "Dluga 10",
      }),
    ).toEqual({
      address: "Dluga 10, Gdansk",
      city: "Gdansk",
      district: "Srodmiescie",
      name: "Dluga 10",
    });
  });

  it("falls back to display name parts without exposing raw coordinates", () => {
    expect(
      normalizeReverseGeocodeResult({
        address: {
          city: "Gdansk",
          neighbourhood: "Oliwa",
        },
        display_name: "Park Oliwski, Oliwa, Gdansk, Pomeranian Voivodeship, Poland",
      }),
    ).toEqual({
      address: "Park Oliwski, Oliwa, Gdansk",
      city: "Gdansk",
      district: "Oliwa",
      name: "Park Oliwski",
    });
  });
});
