"use client";

import {
  CalendarDays,
  ChevronDown,
  Clock3,
  X,
  LayoutGrid,
  List,
  MapPin,
  Search,
  SlidersHorizontal,
  Trash2,
  UsersRound,
} from "lucide-react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import {
  EventDetailsCardTrigger,
  EventDetailsModal,
  EventGenderAvailability,
  type BookingParticipantDefaults,
  type EventDetailsModalEvent,
  type EventMapLocation,
} from "@/entities/event";
import {
  addEventMap3dBuildings,
  bindEventAttributionControl,
  bindMissingMapStyleImages,
  createCollapsedEventAttributionControl,
  EVENT_MAP_DEFAULT_VIEW,
  EVENT_MAP_STYLE,
} from "@/entities/event/components/maplibre-config";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { DatePicker, type DateRangeValue } from "@/shared/ui/DatePicker";
import { Input } from "@/shared/ui/Input";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useFloatingPopover } from "@/shared/hooks/useFloatingPopover";
import { Button } from "@/shared/ui/Button";
import { LoadMore } from "@/shared/ui/LoadMore";
import { RangeSlider, type RangeSliderValue } from "@/shared/ui/RangeSlider";
import { ScrollArea } from "@/shared/ui/ScrollArea";
import { Select } from "@/shared/ui/Select";

import styles from "./ProfileView.module.css";

type ProfileEvent = {
  address: string;
  ageMax: number;
  ageMin: number;
  ageRange: string;
  badge: string;
  capacityTotal: number;
  city?: string;
  conversationMinutes?: number;
  dateLabel: string;
  dateValue: string;
  description: string;
  district: string;
  durationMinutes?: number;
  femaleSpotsAvailable?: number;
  highlights?: string[];
  id: string;
  imageSrc: string;
  language?: string;
  location: readonly [number, number];
  locationLabel?: string;
  maleSpotsAvailable?: number;
  mapLocation?: EventMapLocation;
  organizer?: EventDetailsModalEvent["organizer"];
  price: number;
  priceLabel: string;
  spotsAvailable: number;
  startsAt?: string;
  statusLabel?: string;
  tag: "all" | "closest" | "today" | "week" | "weekend";
  timeLabel: string;
  title: string;
  venueAddress?: string;
  venueName: string;
  weekdayLabel: string;
};

type EventTag = ProfileEvent["tag"];
type SortMode = "date" | "price-asc" | "price-desc";
type ViewMode = "list" | "card";
type FilterKey = "age" | "date" | "district" | "price";

const INITIAL_VISIBLE_EVENTS = 5;
const DEFAULT_AGE_RANGE = { from: 25, to: 45 } satisfies RangeSliderValue;
const DEFAULT_PRICE_RANGE = { from: 100, to: 150 } satisfies RangeSliderValue;

function createEventMapLocation(event: ProfileEvent): EventMapLocation {
  return {
    bearing: -18,
    center: event.location,
    cityLabel: "Gdańsk",
    districtLabel: event.district,
    marker: event.location,
    pitch: 58,
    venueAddress: event.address,
    venueLabel: event.venueName,
    zoom: 15.8,
  };
}

function getEventStartsAt(event: ProfileEvent) {
  if (event.startsAt) {
    return event.startsAt;
  }

  return `${event.dateValue}T${event.timeLabel}:00.000+02:00`;
}

export function filterBookableProfileEvents(events: ProfileEvent[], now = new Date()) {
  return events.filter((event) => {
    const startsAt = new Date(getEventStartsAt(event));

    return (
      !Number.isNaN(startsAt.getTime()) &&
      startsAt.getTime() > now.getTime() &&
      event.spotsAvailable > 0
    );
  });
}

function eventToDetailsEvent(
  event: ProfileEvent,
  t: (key: string, values?: Record<string, number | string>) => string,
): EventDetailsModalEvent {
  const mapLocation = event.mapLocation ?? createEventMapLocation(event);

  return {
    ageRange: event.ageRange,
    capacityTotal: event.capacityTotal,
    city: event.city ?? "Gdańsk",
    conversationMinutes: event.conversationMinutes ?? 10,
    dateLabel: event.dateLabel,
    description: event.description,
    durationMinutes: event.durationMinutes ?? 120,
    highlights: event.highlights ?? [],
    id: event.id,
    language: event.language ?? "PL/EN",
    locationLabel: event.locationLabel ?? `Gdańsk, ${event.district}`,
    mapLocation,
    ...(event.organizer ? { organizer: event.organizer } : {}),
    priceLabel: event.priceLabel,
    ...(event.femaleSpotsAvailable !== undefined
      ? { femaleSpotsAvailable: event.femaleSpotsAvailable }
      : {}),
    ...(event.maleSpotsAvailable !== undefined
      ? { maleSpotsAvailable: event.maleSpotsAvailable }
      : {}),
    spotsAvailable: event.spotsAvailable,
    startsAt: getEventStartsAt(event),
    statusLabel:
      event.statusLabel ??
      (event.spotsAvailable > 0
        ? t("event.availability.seatsAvailable")
        : t("event.availability.none")),
    timeLabel: event.timeLabel,
    title: event.title,
    venueAddress: event.venueAddress ?? event.address,
    venueName: event.venueName,
    weekdayLabel: event.weekdayLabel,
  };
}

const profileEvents = [
  {
    address: "ul. Chlebnicka 10/11, Gdańsk",
    ageMax: 35,
    ageMin: 25,
    ageRange: "25-35",
    badge: "Najbliższe",
    capacityTotal: 20,
    dateLabel: "31 maja",
    dateValue: "2031-05-31",
    description: "Stylowa przestrzeń w sercu Gdańska",
    district: "Stare Miasto",
    id: "stary-spichlerz",
    imageSrc: "/assets/atmosphere/conversation-03.png",
    location: [18.6533, 54.3464],
    price: 129,
    priceLabel: "129 PLN",
    spotsAvailable: 5,
    tag: "closest",
    timeLabel: "19:00",
    title: "RoundDate 25-35",
    venueName: "Restaurant&Bar Stary Spichlerz",
    weekdayLabel: "sob.",
  },
  {
    address: "ul. Opata Jacka Rybińskiego 25, Gdańsk",
    ageMax: 40,
    ageMin: 30,
    ageRange: "30-40",
    badge: "Popularne",
    capacityTotal: 18,
    dateLabel: "7 czerwca",
    dateValue: "2031-06-07",
    description: "Historyczne miejsce i inspirująca atmosfera",
    district: "Oliwa",
    id: "oliwski-ratusz",
    imageSrc: "/assets/atmosphere/gdansk-evening.png",
    location: [18.5605, 54.4104],
    price: 119,
    priceLabel: "119 PLN",
    spotsAvailable: 6,
    tag: "week",
    timeLabel: "19:00",
    title: "RoundDate 30-40",
    venueName: "Oliwski Ratusz Kultury",
    weekdayLabel: "sob.",
  },
  {
    address: "ul. Słowackiego 23, Gdańsk",
    ageMax: 35,
    ageMin: 25,
    ageRange: "25-35",
    badge: "Nowa data",
    capacityTotal: 20,
    dateLabel: "14 czerwca",
    dateValue: "2031-06-14",
    description: "Kameralny wieczór w przytulnej przestrzeni",
    district: "Wrzeszcz",
    id: "stary-manez",
    imageSrc: "/assets/atmosphere/conversation-06.png",
    location: [18.6046, 54.381],
    price: 129,
    priceLabel: "129 PLN",
    spotsAvailable: 8,
    tag: "weekend",
    timeLabel: "19:00",
    title: "RoundDate 25-35",
    venueName: "Restauracja Stary Maneż",
    weekdayLabel: "sob.",
  },
  {
    address: "ul. Cystersów 18, Gdańsk",
    ageMax: 45,
    ageMin: 35,
    ageRange: "35-45",
    badge: "Ostatnie miejsca",
    capacityTotal: 16,
    dateLabel: "21 czerwca",
    dateValue: "2031-06-21",
    description: "Romantyczna klasyka i nowe znajomości",
    district: "Oliwa",
    id: "palac-opatow",
    imageSrc: "/assets/atmosphere/welcome-board.png",
    location: [18.5619, 54.4109],
    price: 139,
    priceLabel: "139 PLN",
    spotsAvailable: 4,
    tag: "weekend",
    timeLabel: "19:00",
    title: "RoundDate 35-45",
    venueName: "Pałac Opatów",
    weekdayLabel: "sob.",
  },
  {
    address: "ul. Toruńska 12, Gdańsk",
    ageMax: 35,
    ageMin: 25,
    ageRange: "25-35",
    badge: "Dzisiaj",
    capacityTotal: 24,
    dateLabel: "Dzisiaj",
    dateValue: "2031-05-28",
    description: "Lekki format na pierwsze spotkanie z projektem",
    district: "Śródmieście",
    id: "hotel-almond",
    imageSrc: "/assets/atmosphere/conversation-02.png",
    location: [18.6483, 54.3438],
    price: 109,
    priceLabel: "109 PLN",
    spotsAvailable: 7,
    tag: "today",
    timeLabel: "20:00",
    title: "RoundDate intro",
    venueName: "Hotel Almond",
    weekdayLabel: "śr.",
  },
  {
    address: "ul. Grunwaldzka 87, Gdańsk",
    ageMax: 44,
    ageMin: 32,
    ageRange: "32-44",
    badge: "Najbliższe",
    capacityTotal: 22,
    dateLabel: "28 czerwca",
    dateValue: "2031-06-28",
    description: "Wieczór dla osób, które lubią rozmowy na żywo",
    district: "Wrzeszcz",
    id: "loft-space",
    imageSrc: "/assets/atmosphere/gdansk-evening.png",
    location: [18.6084, 54.3793],
    price: 129,
    priceLabel: "129 PLN",
    spotsAvailable: 9,
    tag: "closest",
    timeLabel: "19:30",
    title: "RoundDate 32-44",
    venueName: "Loft event space",
    weekdayLabel: "niedz.",
  },
] satisfies ProfileEvent[];

const filterTabConfigs = [
  { labelKey: "profile.eventsPage.filterTabs.all", value: "all" },
  { labelKey: "profile.eventsPage.filterTabs.closest", value: "closest" },
  { labelKey: "profile.eventsPage.filterTabs.today", value: "today" },
  { labelKey: "profile.eventsPage.filterTabs.week", value: "week" },
  { labelKey: "profile.eventsPage.filterTabs.weekend", value: "weekend" },
] satisfies Array<{ labelKey: string; value: EventTag }>;

const districtOptionConfigs = [
  { labelKey: "profile.eventsPage.districtOptions.all", value: "all" },
  { label: "Stare Miasto", value: "Stare Miasto" },
  { label: "Oliwa", value: "Oliwa" },
  { label: "Wrzeszcz", value: "Wrzeszcz" },
  { label: "Śródmieście", value: "Śródmieście" },
];

const sortOptionConfigs = [
  { labelKey: "profile.eventsPage.sortOptions.date", value: "date" },
  { labelKey: "profile.eventsPage.sortOptions.priceAsc", value: "price-asc" },
  { labelKey: "profile.eventsPage.sortOptions.priceDesc", value: "price-desc" },
] satisfies Array<{ labelKey: string; value: SortMode }>;

function formatPriceValue(value: number) {
  return `${value} PLN`;
}

function isSameRange(first: RangeSliderValue, second: RangeSliderValue) {
  return first.from === second.from && first.to === second.to;
}

function createEventsApiUrl(input: {
  ageRange: RangeSliderValue;
  dateRange: DateRangeValue;
  district: string;
  priceRange: RangeSliderValue;
  query: string;
  sortMode: SortMode;
  tag: EventTag;
}) {
  const params = new URLSearchParams({
    status: "published",
    sort: input.sortMode,
    tag: input.tag,
  });
  const normalizedQuery = input.query.trim();

  if (normalizedQuery) {
    params.set("query", normalizedQuery);
  }

  params.set("ageFrom", String(input.ageRange.from));
  params.set("ageTo", String(input.ageRange.to));
  params.set("priceFrom", String(input.priceRange.from));
  params.set("priceTo", String(input.priceRange.to));

  if (input.dateRange.from) {
    params.set("dateFrom", input.dateRange.from);
  }

  if (input.dateRange.to) {
    params.set("dateTo", input.dateRange.to);
  }

  if (input.district !== "all") {
    params.set("district", input.district);
  }

  return `/api/events?${params.toString()}`;
}

type FilterPopoverProps = {
  active?: boolean;
  children: ReactNode;
  label: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  popoverHeight?: number;
  testId?: string;
};

function FilterPopover({
  active,
  children,
  label,
  onOpenChange,
  open,
  popoverHeight = 196,
  testId,
}: FilterPopoverProps) {
  const { t } = useI18n();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverStyle = useFloatingPopover(open, triggerRef, {
    estimatedHeight: popoverHeight,
    maxWidth: 342,
    minWidth: 292,
    preferredWidth: 318,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const element = target instanceof Element ? target : undefined;

      if (element?.closest("[data-datepicker-popover]")) {
        return;
      }

      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        onOpenChange(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  const popover =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            aria-label={t("profile.eventsPage.filterAria", { label })}
            className={styles.eventsFilterPopover}
            data-filter-popover
            id={id}
            role="dialog"
            style={popoverStyle ?? { visibility: "hidden" }}
          >
            {children}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={styles.eventsFilterPill} data-testid={testId}>
      <button
        ref={triggerRef}
        aria-controls={id}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label}
        className={styles.eventsFilterTrigger}
        data-active={active || open || undefined}
        data-variant="plain-filter"
        type="button"
        onClick={() => onOpenChange(!open)}
      >
        <span>{label}</span>
        <ChevronDown aria-hidden data-open={open || undefined} size={17} />
      </button>
      {popover}
    </div>
  );
}

function EventMap({
  events,
  onEventClick,
}: {
  events: ProfileEvent[];
  onEventClick: (event: ProfileEvent) => void;
}) {
  const { t } = useI18n();
  const mapNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    let disposed = false;
    let map: MapLibreMap | null = null;
    let markers: Marker[] = [];
    let unbindAttribution: (() => void) | undefined;
    let unbindMissingImages: (() => void) | undefined;

    async function initMap() {
      try {
        const maplibregl = await import("maplibre-gl");

        if (disposed || !mapNodeRef.current) {
          return;
        }

        map = new maplibregl.Map({
          attributionControl: false,
          bearing: EVENT_MAP_DEFAULT_VIEW.bearing,
          canvasContextAttributes: { antialias: true },
          center: [18.6483, 54.3464],
          container: mapNodeRef.current,
          logoPosition: "bottom-left",
          maplibreLogo: true,
          maxPitch: 72,
          maxZoom: 17,
          minZoom: 10,
          pitch: EVENT_MAP_DEFAULT_VIEW.pitch,
          style: EVENT_MAP_STYLE,
          zoom: 13.85,
        });
        unbindMissingImages = bindMissingMapStyleImages(map);
        map.addControl(
          createCollapsedEventAttributionControl(maplibregl.AttributionControl),
          "bottom-right",
        );
        unbindAttribution = bindEventAttributionControl(map, mapNodeRef.current);

        markers = events.map((event) => {
          const markerNode = document.createElement("button");
          const markerVisual = document.createElement("span");
          const markerIcon = document.createElement("span");

          markerNode.type = "button";
          markerNode.className = styles.eventsMapMarker ?? "";
          markerNode.setAttribute(
            "aria-label",
            t("profile.eventsPage.openDetails", { title: event.title }),
          );
          markerVisual.className = styles.eventsMapMarkerVisual ?? "";
          markerIcon.className = styles.eventsMapMarkerIcon ?? "";
          markerVisual.append(markerIcon);
          markerNode.append(markerVisual);
          markerNode.addEventListener("click", (clickEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            onEventClick(event);
          });
          markerNode.addEventListener("pointerdown", (pointerEvent) => {
            pointerEvent.stopPropagation();
          });

          return new maplibregl.Marker({ element: markerNode })
            .setLngLat([event.location[0], event.location[1]])
            .addTo(map!);
        });

        map.once("load", () => {
          if (!map || disposed) {
            return;
          }

          addEventMap3dBuildings(
            map,
            events.map((event) => event.location),
            { id: "events-list-buildings" },
          );
          mapNodeRef.current?.setAttribute(
            "data-map-3d-ready",
            map.getLayer("events-list-buildings") ? "true" : "false",
          );
          map.resize();
        });
      } catch {
        map = null;
      }
    }

    void initMap();

    return () => {
      disposed = true;
      unbindAttribution?.();
      unbindMissingImages?.();
      markers.forEach((marker) => marker.remove());
      map?.remove();
    };
  }, [events, onEventClick, t]);

  return (
    <div className={styles.eventsMapSlot}>
      <section
        aria-label={t("profile.eventsPage.mapAria")}
        className={styles.eventsMapCard}
        data-map-layout="sticky-panel"
        data-map-size="cards-fit"
        data-testid="events-map"
        role="region"
      >
        <div className={styles.eventsMapCanvas} ref={mapNodeRef} />
        <div className={styles.eventsMapFallback} aria-hidden>
          <span className={styles.eventsMapCity}>Gdańsk</span>
          {events.slice(0, 4).map((event, index) => (
            <span
              className={styles.eventsMapStaticMarker}
              data-index={index}
              key={`static-${event.id}`}
            >
              <span className={styles.eventsMapMarkerVisual} aria-hidden>
                <span className={styles.eventsMapMarkerIcon} />
              </span>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

type ProfileEventsViewProps = {
  bookingDefaults?: BookingParticipantDefaults;
  events?: ProfileEvent[];
};

export function ProfileEventsView({
  bookingDefaults,
  events = profileEvents,
}: ProfileEventsViewProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<EventTag>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [serverEvents, setServerEvents] = useState<ProfileEvent[]>(() =>
    filterBookableProfileEvents(events),
  );
  const [selectedMapEvent, setSelectedMapEvent] = useState<ProfileEvent | null>(null);
  const [ageRange, setAgeRange] = useState<RangeSliderValue>(DEFAULT_AGE_RANGE);
  const [dateRange, setDateRange] = useState<DateRangeValue>({});
  const [district, setDistrict] = useState("all");
  const [priceRange, setPriceRange] = useState<RangeSliderValue>(DEFAULT_PRICE_RANGE);
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 360);
  const debouncedAgeRange = useDebounce(ageRange, 360);
  const debouncedPriceRange = useDebounce(priceRange, 360);
  const effectiveQuery = query.trim() ? debouncedQuery : "";
  const effectiveAgeRange = isSameRange(ageRange, DEFAULT_AGE_RANGE) ? ageRange : debouncedAgeRange;
  const effectivePriceRange = isSameRange(priceRange, DEFAULT_PRICE_RANGE)
    ? priceRange
    : debouncedPriceRange;
  const filterTabs = useMemo(
    () =>
      filterTabConfigs.map((tab) => ({
        label: t(tab.labelKey),
        value: tab.value,
      })),
    [t],
  );
  const districtOptions = useMemo(
    () =>
      districtOptionConfigs.map((option) => ({
        label: "labelKey" in option ? t(option.labelKey) : option.label,
        value: option.value,
      })),
    [t],
  );
  const sortOptions = useMemo(
    () =>
      sortOptionConfigs.map((option) => ({
        label: t(option.labelKey),
        value: option.value,
      })),
    [t],
  );

  const eventsApiUrl = useMemo(
    () =>
      createEventsApiUrl({
        ageRange: effectiveAgeRange,
        dateRange,
        district,
        priceRange: effectivePriceRange,
        query: effectiveQuery,
        sortMode,
        tag: activeTag,
      }),
    [
      activeTag,
      dateRange,
      district,
      effectiveAgeRange,
      effectivePriceRange,
      effectiveQuery,
      sortMode,
    ],
  );

  const activeMobileFilterCount = useMemo(
    () =>
      [
        activeTag !== "all",
        !isSameRange(ageRange, DEFAULT_AGE_RANGE),
        Boolean(dateRange.from || dateRange.to),
        district !== "all",
        !isSameRange(priceRange, DEFAULT_PRICE_RANGE),
        sortMode !== "date",
        viewMode !== "list",
      ].filter(Boolean).length,
    [activeTag, ageRange, dateRange, district, priceRange, sortMode, viewMode],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      try {
        const response = await fetch(eventsApiUrl, { signal: controller.signal });
        const payload = (await response.json()) as { events?: ProfileEvent[] };

        if (!response.ok) {
          throw new Error("Failed to load events");
        }

        setServerEvents(
          filterBookableProfileEvents(Array.isArray(payload.events) ? payload.events : []),
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load filtered events", error);
          setServerEvents([]);
        }
      }
    }

    void loadEvents();

    return () => {
      controller.abort();
    };
  }, [eventsApiUrl]);

  useEffect(() => {
    if (!isMobileFiltersOpen) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileFiltersOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isMobileFiltersOpen]);

  function resetFilters() {
    setQuery("");
    setActiveTag("all");
    setAgeRange(DEFAULT_AGE_RANGE);
    setDateRange({});
    setDistrict("all");
    setPriceRange(DEFAULT_PRICE_RANGE);
    setSortMode("date");
    setViewMode("list");
    setOpenFilter(null);
    setIsMobileFiltersOpen(false);
    setServerEvents(filterBookableProfileEvents(events));
  }

  return (
    <section className={styles.eventsScreen} aria-labelledby="profile-section-title">
      <div
        className={styles.eventsToolbar}
        data-layout="search-left-filters-right"
        data-padding="compact"
        data-testid="events-toolbar"
      >
        <Input
          className={styles.eventsSearch}
          leftIcon={<Search aria-hidden size={19} />}
          placeholder={t("profile.eventsPage.searchPlaceholder")}
          size="sm"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />

        <button
          aria-expanded={isMobileFiltersOpen}
          aria-haspopup="dialog"
          className={styles.eventsMobileFilterButton}
          data-active={activeMobileFilterCount > 0 ? "true" : undefined}
          data-testid="events-mobile-filter-trigger"
          type="button"
          onClick={() => {
            setOpenFilter(null);
            setIsMobileFiltersOpen((value) => !value);
          }}
        >
          <SlidersHorizontal aria-hidden size={18} />
          <span>{t("profile.eventsPage.filters")}</span>
          {activeMobileFilterCount > 0 ? <strong>{activeMobileFilterCount}</strong> : null}
        </button>

        <div
          className={styles.eventsFilterBar}
          aria-label={t("profile.eventsPage.filtersAria")}
          data-align="right"
          data-separators="rounded"
          data-size="wide"
          data-spacing="equal"
          data-testid="events-filter-bar"
        >
          <FilterPopover
            active={!isSameRange(ageRange, DEFAULT_AGE_RANGE)}
            label={t("profile.eventsPage.age")}
            open={openFilter === "age"}
            testId="events-filter-age"
            onOpenChange={(open) => setOpenFilter(open ? "age" : null)}
          >
            <RangeSlider
              formatValue={(value) => String(value)}
              label={t("profile.eventsPage.age")}
              max={50}
              min={18}
              value={ageRange}
              onChange={setAgeRange}
            />
          </FilterPopover>

          <FilterPopover
            active={Boolean(dateRange.from || dateRange.to)}
            label={t("profile.eventsPage.date")}
            open={openFilter === "date"}
            popoverHeight={440}
            testId="events-filter-date"
            onOpenChange={(open) => setOpenFilter(open ? "date" : null)}
          >
            <button
              className={styles.eventsAnyDateButton}
              data-active={!dateRange.from && !dateRange.to}
              type="button"
              onClick={() => setDateRange({})}
            >
              {t("profile.eventsPage.allDate")}
            </button>
            <DatePicker
              label={t("profile.eventsPage.date")}
              max="2031-06-30"
              maxYear={2031}
              min="2031-05-01"
              minYear={2031}
              mode="range"
              placeholder={t("profile.eventsPage.allDate")}
              rangeValue={dateRange}
              size="sm"
              onRangeChange={setDateRange}
            />
          </FilterPopover>

          <FilterPopover
            active={district !== "all"}
            label={t("profile.eventsPage.district")}
            open={openFilter === "district"}
            testId="events-filter-district"
            onOpenChange={(open) => setOpenFilter(open ? "district" : null)}
          >
            <div className={styles.eventsDistrictDraft}>
              <p>{t("profile.eventsPage.districtHint")}</p>
              <div className={styles.eventsDistrictOptions}>
                {districtOptions.map((option) => (
                  <button
                    aria-pressed={district === option.value}
                    className={
                      district === option.value ? styles.eventsDistrictOptionActive : undefined
                    }
                    key={option.value}
                    type="button"
                    onClick={() => setDistrict(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </FilterPopover>

          <FilterPopover
            active={!isSameRange(priceRange, DEFAULT_PRICE_RANGE)}
            label={t("profile.eventsPage.price")}
            open={openFilter === "price"}
            testId="events-filter-price"
            onOpenChange={(open) => setOpenFilter(open ? "price" : null)}
          >
            <RangeSlider
              formatValue={formatPriceValue}
              label={t("profile.eventsPage.price")}
              max={150}
              min={90}
              step={5}
              value={priceRange}
              onChange={setPriceRange}
            />
          </FilterPopover>

          <button
            aria-label={t("profile.eventsPage.resetFilters")}
            className={styles.eventsFiltersReset}
            type="button"
            onClick={resetFilters}
          >
            <Trash2 aria-hidden size={18} />
          </button>
        </div>
      </div>

      {isMobileFiltersOpen ? (
        <div className={styles.eventsMobileFilterOverlay}>
          <section
            className={styles.eventsMobileFilterPanel}
            aria-label={t("profile.eventsPage.filtersAria")}
            aria-modal="true"
            role="dialog"
          >
            <div className={styles.eventsMobileFilterHeader}>
              <div>
                <h2>{t("profile.eventsPage.filters")}</h2>
                <p>{t("profile.eventsPage.filterSubtitle")}</p>
              </div>
              <button
                aria-label={t("common.actions.close")}
                className={styles.eventsMobileFilterClose}
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
              >
                <X aria-hidden size={18} />
              </button>
            </div>

            <div className={styles.eventsMobileFilterContent}>
              <section className={styles.eventsMobileFilterSection}>
                <h3>{t("profile.eventsPage.selection")}</h3>
                <div className={styles.eventsMobileFilterChips}>
                  {filterTabs.map((tab) => (
                    <button
                      aria-pressed={activeTag === tab.value}
                      className={
                        activeTag === tab.value ? styles.eventsMobileFilterChipActive : undefined
                      }
                      key={tab.value}
                      type="button"
                      onClick={() => setActiveTag(tab.value)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className={styles.eventsMobileFilterSection}>
                <RangeSlider
                  formatValue={(value) => String(value)}
                  label={t("profile.eventsPage.age")}
                  max={50}
                  min={18}
                  value={ageRange}
                  onChange={setAgeRange}
                />
              </section>

              <section className={styles.eventsMobileFilterSection}>
                <div className={styles.eventsMobileDateControls}>
                  <DatePicker
                    label={t("profile.eventsPage.date")}
                    max="2031-06-30"
                    maxYear={2031}
                    min="2031-05-01"
                    minYear={2031}
                    mode="range"
                    placeholder={t("profile.eventsPage.allDate")}
                    rangeValue={dateRange}
                    size="sm"
                    onRangeChange={setDateRange}
                  />
                </div>
              </section>

              <section className={styles.eventsMobileFilterSection}>
                <h3>{t("profile.eventsPage.district")}</h3>
                <div className={styles.eventsDistrictOptions}>
                  {districtOptions.map((option) => (
                    <button
                      aria-pressed={district === option.value}
                      className={
                        district === option.value ? styles.eventsDistrictOptionActive : undefined
                      }
                      key={option.value}
                      type="button"
                      onClick={() => setDistrict(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className={styles.eventsMobileFilterSection}>
                <RangeSlider
                  formatValue={formatPriceValue}
                  label={t("profile.eventsPage.price")}
                  max={150}
                  min={90}
                  step={5}
                  value={priceRange}
                  onChange={setPriceRange}
                />
              </section>

              <section className={styles.eventsMobileFilterSection}>
                <h3>{t("profile.eventsPage.sort")}</h3>
                <div className={styles.eventsMobileSortSelect}>
                  <Select
                    options={sortOptions}
                    size="sm"
                    value={sortMode}
                    onChange={(value) => setSortMode(value as SortMode)}
                  />
                </div>
              </section>

              <section className={styles.eventsMobileFilterSection}>
                <h3>{t("profile.eventsPage.view")}</h3>
                <div className={styles.eventsMobileViewMode}>
                  <button
                    aria-pressed={viewMode === "list"}
                    className={viewMode === "list" ? styles.eventsMobileViewModeActive : undefined}
                    type="button"
                    onClick={() => setViewMode("list")}
                  >
                    <List aria-hidden size={18} />
                    {t("profile.eventsPage.list")}
                  </button>
                  <button
                    aria-pressed={viewMode === "card"}
                    className={viewMode === "card" ? styles.eventsMobileViewModeActive : undefined}
                    type="button"
                    onClick={() => setViewMode("card")}
                  >
                    <LayoutGrid aria-hidden size={18} />
                    {t("profile.eventsPage.cards")}
                  </button>
                </div>
              </section>
            </div>

            <div className={styles.eventsMobileFilterFooter}>
              <button
                className={styles.eventsMobileResetButton}
                type="button"
                onClick={resetFilters}
              >
                <Trash2 aria-hidden size={17} />
                {t("profile.eventsPage.resetFilters")}
              </button>
              <Button size="sm" onClick={() => setIsMobileFiltersOpen(false)}>
                {t("profile.eventsPage.done")}
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      <div
        className={styles.eventsQuickBar}
        data-layout="tabs-left-controls-right"
        data-testid="events-quick-actions"
      >
        <div
          className={styles.eventsQuickFilters}
          aria-label={t("profile.eventsPage.quickFiltersAria")}
          data-testid="events-quick-filters"
        >
          {filterTabs.map((tab) => (
            <button
              aria-pressed={activeTag === tab.value}
              className={activeTag === tab.value ? styles.eventsQuickFilterActive : undefined}
              key={tab.value}
              type="button"
              onClick={() => setActiveTag(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          className={styles.eventsListControls}
          data-layout="sort-left-view-right"
          data-testid="events-list-controls"
        >
          <div className={styles.eventsSortSelect} data-testid="events-sort-select">
            <Select
              options={sortOptions}
              size="sm"
              value={sortMode}
              onChange={(value) => setSortMode(value as SortMode)}
            />
          </div>

          <div
            className={styles.eventsViewToggle}
            aria-label={t("profile.eventsPage.viewModeAria")}
            data-placement="right"
            data-testid="events-view-toggle"
          >
            <button
              aria-label={t("profile.eventsPage.list")}
              aria-pressed={viewMode === "list"}
              className={viewMode === "list" ? styles.eventsViewToggleActive : undefined}
              type="button"
              onClick={() => setViewMode("list")}
            >
              <List aria-hidden size={19} />
            </button>
            <button
              aria-label={t("profile.eventsPage.cards")}
              aria-pressed={viewMode === "card"}
              className={viewMode === "card" ? styles.eventsViewToggleActive : undefined}
              type="button"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid aria-hidden size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.eventsLayout}>
        <ScrollArea className={styles.eventsListColumn} data-testid="events-list-column">
          {serverEvents.length > 0 ? (
            <LoadMore
              increment={2}
              initialCount={INITIAL_VISIBLE_EVENTS}
              items={serverEvents}
              label={t("profile.eventsPage.loadMore")}
              resetKey={eventsApiUrl}
            >
              {(visibleEvents) => (
                <div
                  className={styles.eventsList}
                  data-mobile-layout={viewMode === "list" ? "compact-list" : "card-grid"}
                  data-testid="events-list"
                  data-view={viewMode}
                >
                  {visibleEvents.map((event) => {
                    const detailsEvent = eventToDetailsEvent(event, t);

                    return (
                      <EventDetailsCardTrigger
                        ariaLabel={t("profile.eventsPage.openDetails", { title: event.title })}
                        {...(bookingDefaults ? { bookingDefaults } : {})}
                        className={styles.eventListCard}
                        event={detailsEvent}
                        key={event.id}
                        testId="event-card"
                      >
                        <Image
                          alt=""
                          className={styles.eventListImage}
                          height={142}
                          key="event-image"
                          src={event.imageSrc}
                          width={220}
                        />
                        <div className={styles.eventListMain} key="event-main">
                          <span className={styles.eventListBadge}>{event.badge}</span>
                          <h2>{event.title}</h2>
                          <p>
                            <MapPin aria-hidden size={16} />
                            {event.venueName}
                          </p>
                          <p className={styles.eventListAddress}>{event.address}</p>
                          <p className={styles.eventListDescription}>{event.description}</p>
                        </div>

                        <div className={styles.eventListDetails} key="event-details">
                          <span>
                            <CalendarDays aria-hidden size={19} />
                            {event.dateLabel}, {event.weekdayLabel}
                          </span>
                          <span>
                            <Clock3 aria-hidden size={19} />
                            {event.timeLabel}
                          </span>
                          <span>
                            <UsersRound aria-hidden size={19} />
                            {t("profile.eventsPage.age")}: <strong>{event.ageRange}</strong>
                          </span>
                        </div>

                        <div className={styles.eventListActions} key="event-actions">
                          <EventGenderAvailability
                            className={styles.eventListAvailability}
                            size="sm"
                            spotsAvailable={event.spotsAvailable}
                          />
                          <strong>{event.priceLabel}</strong>
                        </div>
                      </EventDetailsCardTrigger>
                    );
                  })}
                </div>
              )}
            </LoadMore>
          ) : (
            <div
              className={styles.eventsEmptyState}
              aria-live="polite"
              data-testid="events-empty-state"
            >
              <span className={styles.eventsEmptyIcon} aria-hidden>
                <Search size={28} />
              </span>
              <h2>{t("profile.eventsPage.emptyTitle")}</h2>
              <p>{t("profile.eventsPage.emptyDescription")}</p>
              <Button leftIcon={<Trash2 aria-hidden size={17} />} size="md" onClick={resetFilters}>
                {t("profile.eventsPage.resetFilters")}
              </Button>
            </div>
          )}
        </ScrollArea>

        <EventMap events={serverEvents} onEventClick={setSelectedMapEvent} />
      </div>

      {selectedMapEvent ? (
        <EventDetailsModal
          {...(bookingDefaults ? { bookingDefaults } : {})}
          context="available"
          event={eventToDetailsEvent(selectedMapEvent, t)}
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelectedMapEvent(null);
            }
          }}
        />
      ) : null}
    </section>
  );
}
