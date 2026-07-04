type ReverseGeocodeAddress = {
  borough?: string;
  city?: string;
  city_district?: string;
  county?: string;
  footway?: string;
  hamlet?: string;
  house_number?: string;
  municipality?: string;
  neighbourhood?: string;
  path?: string;
  pedestrian?: string;
  quarter?: string;
  residential?: string;
  road?: string;
  state?: string;
  suburb?: string;
  town?: string;
  village?: string;
};

export type NominatimReverseGeocodeResult = {
  address?: ReverseGeocodeAddress;
  display_name?: string;
  name?: string;
};

export type NormalizedReverseGeocodeResult = {
  address: string;
  city: string;
  district: string;
  name: string;
};

function clean(value: string | undefined) {
  const nextValue = value?.trim();

  return nextValue || undefined;
}

function firstAddressValue(
  address: ReverseGeocodeAddress | undefined,
  keys: Array<keyof ReverseGeocodeAddress>,
) {
  for (const key of keys) {
    const value = clean(address?.[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function getDisplayParts(displayName: string | undefined) {
  return (displayName ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function normalizeReverseGeocodeResult(
  result: NominatimReverseGeocodeResult,
): NormalizedReverseGeocodeResult {
  const displayParts = getDisplayParts(result.display_name);
  const city =
    firstAddressValue(result.address, ["city", "town", "village", "municipality", "county"]) ??
    displayParts.find((part) => /gdansk|gdańsk/i.test(part)) ??
    displayParts[2] ??
    "";
  const district =
    firstAddressValue(result.address, [
      "suburb",
      "city_district",
      "neighbourhood",
      "quarter",
      "borough",
      "hamlet",
    ]) ??
    displayParts[1] ??
    "";
  const street = firstAddressValue(result.address, [
    "road",
    "pedestrian",
    "residential",
    "footway",
    "path",
  ]);
  const houseNumber = clean(result.address?.house_number);
  const streetLine = [street, houseNumber].filter(Boolean).join(" ");
  const address = streetLine
    ? [streetLine, city].filter(Boolean).join(", ")
    : displayParts.slice(0, 3).join(", ");
  const name = clean(result.name) ?? (streetLine || displayParts[0] || address);

  return {
    address,
    city,
    district,
    name,
  };
}
