export type EventGenderAvailability = {
  female: number;
  male: number;
};

export function splitEventGenderAvailability(spotsAvailable: number): EventGenderAvailability {
  const normalizedSpots = Math.max(0, Math.floor(spotsAvailable));

  return {
    female: Math.ceil(normalizedSpots / 2),
    male: Math.floor(normalizedSpots / 2),
  };
}
