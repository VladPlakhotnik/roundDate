"use client";

import {
  CalendarDays,
  ChevronDown,
  Clock3,
  LayoutGrid,
  List,
  MapPin,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import {
  EventDetailsCardTrigger,
  type EventDetailsModalEvent,
  type EventMapLocation,
} from "@/entities/event";
import {
  addEventMap3dBuildings,
  bindMissingMapStyleImages,
  EVENT_MAP_DEFAULT_VIEW,
  EVENT_MAP_STYLE,
} from "@/entities/event/components/maplibre-config";
import { DatePicker, type DateRangeValue } from "@/shared/ui/DatePicker";
import { Input } from "@/shared/ui/Input";
import { useFloatingPopover } from "@/shared/hooks/useFloatingPopover";
import { LoadMore } from "@/shared/ui/LoadMore";
import { RangeSlider, type RangeSliderValue } from "@/shared/ui/RangeSlider";
import { Select } from "@/shared/ui/Select";

import styles from "./ProfileView.module.css";

type ProfileEvent = {
  address: string;
  ageMax: number;
  ageMin: number;
  ageRange: string;
  badge: string;
  capacityTotal: number;
  dateLabel: string;
  dateValue: string;
  description: string;
  district: string;
  id: string;
  imageSrc: string;
  location: readonly [number, number];
  price: number;
  priceLabel: string;
  spotsAvailable: number;
  tag: "all" | "closest" | "today" | "week" | "weekend";
  timeLabel: string;
  title: string;
  venueName: string;
  weekdayLabel: string;
};

type EventTag = ProfileEvent["tag"];
type SortMode = "date" | "price-asc" | "price-desc";
type ViewMode = "list" | "card";
type FilterKey = "age" | "date" | "district" | "price";

const INITIAL_VISIBLE_EVENTS = 5;

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
  return `${event.dateValue}T${event.timeLabel}:00.000+02:00`;
}

function eventToDetailsEvent(event: ProfileEvent): EventDetailsModalEvent {
  return {
    ageRange: event.ageRange,
    capacityTotal: event.capacityTotal,
    city: "Gdańsk",
    conversationMinutes: 10,
    dateLabel: event.dateLabel,
    description: event.description,
    durationMinutes: 120,
    highlights: [],
    id: event.id,
    language: "RU/PL",
    locationLabel: `Gdańsk, ${event.district}`,
    mapLocation: createEventMapLocation(event),
    priceLabel: event.priceLabel,
    spotsAvailable: event.spotsAvailable,
    startsAt: getEventStartsAt(event),
    statusLabel: event.spotsAvailable > 0 ? "Места есть" : "Мест нет",
    timeLabel: event.timeLabel,
    title: event.title,
    venueAddress: event.address,
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
    badge: "Ближайшее",
    capacityTotal: 20,
    dateLabel: "31 мая",
    dateValue: "2031-05-31",
    description: "Стильное пространство в сердце Гданьска",
    district: "Stare Miasto",
    id: "stary-spichlerz",
    imageSrc: "/assets/atmosphere/conversation-03.png",
    location: [18.6533, 54.3464],
    price: 129,
    priceLabel: "129 PLN",
    spotsAvailable: 5,
    tag: "closest",
    timeLabel: "19:00",
    title: "Speed dating 25-35",
    venueName: "Restaurant&Bar Stary Spichlerz",
    weekdayLabel: "сб",
  },
  {
    address: "ul. Opata Jacka Rybińskiego 25, Gdańsk",
    ageMax: 40,
    ageMin: 30,
    ageRange: "30-40",
    badge: "Популярное",
    capacityTotal: 18,
    dateLabel: "7 июня",
    dateValue: "2031-06-07",
    description: "Историческое место, вдохновляющая атмосфера",
    district: "Oliwa",
    id: "oliwski-ratusz",
    imageSrc: "/assets/atmosphere/gdansk-evening.png",
    location: [18.5605, 54.4104],
    price: 119,
    priceLabel: "119 PLN",
    spotsAvailable: 6,
    tag: "week",
    timeLabel: "19:00",
    title: "Speed dating 30-40",
    venueName: "Oliwski Ratusz Kultury",
    weekdayLabel: "сб",
  },
  {
    address: "ul. Słowackiego 23, Gdańsk",
    ageMax: 35,
    ageMin: 25,
    ageRange: "25-35",
    badge: "Новая дата",
    capacityTotal: 20,
    dateLabel: "14 июня",
    dateValue: "2031-06-14",
    description: "Уютный вечер в камерной обстановке",
    district: "Wrzeszcz",
    id: "stary-manez",
    imageSrc: "/assets/atmosphere/conversation-06.png",
    location: [18.6046, 54.381],
    price: 129,
    priceLabel: "129 PLN",
    spotsAvailable: 8,
    tag: "weekend",
    timeLabel: "19:00",
    title: "Speed dating 25-35",
    venueName: "Restauracja Stary Maneż",
    weekdayLabel: "сб",
  },
  {
    address: "ul. Cystersów 18, Gdańsk",
    ageMax: 45,
    ageMin: 35,
    ageRange: "35-45",
    badge: "Последние места",
    capacityTotal: 16,
    dateLabel: "21 июня",
    dateValue: "2031-06-21",
    description: "Романтическая классика и новые знакомства",
    district: "Oliwa",
    id: "palac-opatow",
    imageSrc: "/assets/atmosphere/welcome-board.png",
    location: [18.5619, 54.4109],
    price: 139,
    priceLabel: "139 PLN",
    spotsAvailable: 4,
    tag: "weekend",
    timeLabel: "19:00",
    title: "Speed dating 35-45",
    venueName: "Pałac Opatów",
    weekdayLabel: "сб",
  },
  {
    address: "ul. Toruńska 12, Gdańsk",
    ageMax: 35,
    ageMin: 25,
    ageRange: "25-35",
    badge: "Сегодня",
    capacityTotal: 24,
    dateLabel: "Сегодня",
    dateValue: "2031-05-28",
    description: "Легкий формат для первого знакомства с проектом",
    district: "Śródmieście",
    id: "hotel-almond",
    imageSrc: "/assets/atmosphere/conversation-02.png",
    location: [18.6483, 54.3438],
    price: 109,
    priceLabel: "109 PLN",
    spotsAvailable: 7,
    tag: "today",
    timeLabel: "20:00",
    title: "Speed dating intro",
    venueName: "Hotel Almond",
    weekdayLabel: "ср",
  },
  {
    address: "ul. Grunwaldzka 87, Gdańsk",
    ageMax: 44,
    ageMin: 32,
    ageRange: "32-44",
    badge: "Ближайшее",
    capacityTotal: 22,
    dateLabel: "28 июня",
    dateValue: "2031-06-28",
    description: "Вечер для тех, кто любит живые разговоры",
    district: "Wrzeszcz",
    id: "loft-space",
    imageSrc: "/assets/atmosphere/gdansk-evening.png",
    location: [18.6084, 54.3793],
    price: 129,
    priceLabel: "129 PLN",
    spotsAvailable: 9,
    tag: "closest",
    timeLabel: "19:30",
    title: "Speed dating 32-44",
    venueName: "Loft event space",
    weekdayLabel: "вс",
  },
] satisfies ProfileEvent[];

const filterTabs = [
  { label: "Ближайшие", value: "closest" },
  { label: "Сегодня", value: "today" },
  { label: "На этой неделе", value: "week" },
  { label: "На выходных", value: "weekend" },
  { label: "Все мероприятия", value: "all" },
] satisfies Array<{ label: string; value: EventTag }>;

const districtOptions = [
  { label: "Любой район", value: "all" },
  { label: "Stare Miasto", value: "Stare Miasto" },
  { label: "Oliwa", value: "Oliwa" },
  { label: "Wrzeszcz", value: "Wrzeszcz" },
  { label: "Śródmieście", value: "Śródmieście" },
];

const sortOptions = [
  { label: "По дате", value: "date" },
  { label: "Сначала дешевле", value: "price-asc" },
  { label: "Сначала дороже", value: "price-desc" },
] satisfies Array<{ label: string; value: SortMode }>;

function parseDateValue(value: string | undefined) {
  return value ? new Date(`${value}T00:00:00.000+02:00`) : undefined;
}

function formatPriceValue(value: number) {
  return `${value} PLN`;
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
            aria-label={`Фильтр: ${label}`}
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

function EventMap({ events }: { events: ProfileEvent[] }) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    let disposed = false;
    let map: MapLibreMap | null = null;
    let markers: Marker[] = [];
    let unbindMissingImages: (() => void) | undefined;

    async function initMap() {
      try {
        const maplibregl = await import("maplibre-gl");

        if (disposed || !mapNodeRef.current) {
          return;
        }

        map = new maplibregl.Map({
          attributionControl: { compact: true },
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
          zoom: 14.85,
        });
        unbindMissingImages = bindMissingMapStyleImages(map);

        markers = events.map((event, index) => {
          const markerNode = document.createElement("div");
          markerNode.className = styles.eventsMapMarker ?? "";
          markerNode.textContent = String(index + 1);

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
      unbindMissingImages?.();
      markers.forEach((marker) => marker.remove());
      map?.remove();
    };
  }, [events]);

  return (
    <div className={styles.eventsMapSlot}>
      <section
        aria-label="Карта мероприятий"
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
              {index + 1}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ProfileEventsView() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<EventTag>("closest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [listResetKey, setListResetKey] = useState(0);
  const [ageRange, setAgeRange] = useState<RangeSliderValue>({ from: 25, to: 45 });
  const [dateRange, setDateRange] = useState<DateRangeValue>({});
  const [district, setDistrict] = useState("all");
  const [priceRange, setPriceRange] = useState<RangeSliderValue>({ from: 100, to: 150 });
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const fromDate = parseDateValue(dateRange.from);
    const toDate = parseDateValue(dateRange.to);

    const nextEvents = profileEvents.filter((event) => {
      const eventDate = parseDateValue(event.dateValue)!;
      const matchesTag = activeTag === "all" || activeTag === "closest" || event.tag === activeTag;
      const matchesQuery =
        !normalizedQuery ||
        [event.title, event.venueName, event.address, event.district]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesAge = event.ageMax >= ageRange.from && event.ageMin <= ageRange.to;
      const matchesPrice = event.price >= priceRange.from && event.price <= priceRange.to;
      const matchesDistrict = district === "all" || event.district === district;
      const matchesDate = (!fromDate || eventDate >= fromDate) && (!toDate || eventDate <= toDate);

      return (
        matchesTag && matchesQuery && matchesAge && matchesPrice && matchesDistrict && matchesDate
      );
    });

    return nextEvents.sort((first, second) => {
      if (sortMode === "price-asc") {
        return first.price - second.price;
      }

      if (sortMode === "price-desc") {
        return second.price - first.price;
      }

      return first.dateValue.localeCompare(second.dateValue);
    });
  }, [activeTag, ageRange, dateRange, district, priceRange, query, sortMode]);
  function resetList() {
    setListResetKey((current) => current + 1);
  }

  function resetFilters() {
    setQuery("");
    setActiveTag("closest");
    setAgeRange({ from: 25, to: 45 });
    setDateRange({});
    setDistrict("all");
    setPriceRange({ from: 100, to: 150 });
    setOpenFilter(null);
    resetList();
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
          placeholder="Поиск по названию или месту"
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setActiveTag("all");
            resetList();
          }}
        />

        <div
          className={styles.eventsFilterBar}
          aria-label="Фильтры мероприятий"
          data-align="right"
          data-separators="rounded"
          data-size="wide"
          data-spacing="equal"
          data-testid="events-filter-bar"
        >
          <FilterPopover
            active={ageRange.from !== 25 || ageRange.to !== 45}
            label="Возраст"
            open={openFilter === "age"}
            testId="events-filter-age"
            onOpenChange={(open) => setOpenFilter(open ? "age" : null)}
          >
            <RangeSlider
              formatValue={(value) => String(value)}
              label="Возраст"
              max={50}
              min={18}
              value={ageRange}
              onChange={(value) => {
                setAgeRange(value);
                resetList();
              }}
            />
          </FilterPopover>

          <FilterPopover
            active={Boolean(dateRange.from || dateRange.to)}
            label="Дата"
            open={openFilter === "date"}
            popoverHeight={440}
            testId="events-filter-date"
            onOpenChange={(open) => setOpenFilter(open ? "date" : null)}
          >
            <button
              className={styles.eventsAnyDateButton}
              data-active={!dateRange.from && !dateRange.to}
              type="button"
              onClick={() => {
                setDateRange({});
                resetList();
              }}
            >
              Любая дата
            </button>
            <DatePicker
              label="Дата"
              max="2031-06-30"
              maxYear={2031}
              min="2031-05-01"
              minYear={2031}
              mode="range"
              placeholder="Любая дата"
              rangeValue={dateRange}
              size="sm"
              onRangeChange={(value) => {
                setDateRange(value);
                resetList();
              }}
            />
          </FilterPopover>

          <FilterPopover
            active={district !== "all"}
            label="Район"
            open={openFilter === "district"}
            testId="events-filter-district"
            onOpenChange={(open) => setOpenFilter(open ? "district" : null)}
          >
            <div className={styles.eventsDistrictDraft}>
              <p>Настройки района можно будет расширить позже</p>
              <div className={styles.eventsDistrictOptions}>
                {districtOptions.map((option) => (
                  <button
                    aria-pressed={district === option.value}
                    className={
                      district === option.value ? styles.eventsDistrictOptionActive : undefined
                    }
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setDistrict(option.value);
                      resetList();
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </FilterPopover>

          <FilterPopover
            active={priceRange.from !== 100 || priceRange.to !== 150}
            label="Цена"
            open={openFilter === "price"}
            testId="events-filter-price"
            onOpenChange={(open) => setOpenFilter(open ? "price" : null)}
          >
            <RangeSlider
              formatValue={formatPriceValue}
              label="Цена"
              max={150}
              min={90}
              step={5}
              value={priceRange}
              onChange={(value) => {
                setPriceRange(value);
                resetList();
              }}
            />
          </FilterPopover>

          <button
            aria-label="Сбросить фильтры"
            className={styles.eventsFiltersReset}
            type="button"
            onClick={resetFilters}
          >
            <Trash2 aria-hidden size={18} />
          </button>
        </div>
      </div>

      <div
        className={styles.eventsQuickBar}
        data-layout="tabs-left-controls-right"
        data-testid="events-quick-actions"
      >
        <div
          className={styles.eventsQuickFilters}
          aria-label="Быстрые фильтры"
          data-testid="events-quick-filters"
        >
          {filterTabs.map((tab) => (
            <button
              aria-pressed={activeTag === tab.value}
              className={activeTag === tab.value ? styles.eventsQuickFilterActive : undefined}
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTag(tab.value);
                resetList();
              }}
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
              onChange={(value) => {
                setSortMode(value as SortMode);
                resetList();
              }}
            />
          </div>

          <div
            className={styles.eventsViewToggle}
            aria-label="Режим отображения"
            data-placement="right"
            data-testid="events-view-toggle"
          >
            <button
              aria-label="Список"
              aria-pressed={viewMode === "list"}
              className={viewMode === "list" ? styles.eventsViewToggleActive : undefined}
              type="button"
              onClick={() => setViewMode("list")}
            >
              <List aria-hidden size={19} />
            </button>
            <button
              aria-label="Карточки"
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
        <div className={styles.eventsListColumn} data-testid="events-list-column">
          <LoadMore
            increment={2}
            initialCount={INITIAL_VISIBLE_EVENTS}
            items={filteredEvents}
            label="Показать еще мероприятия"
            resetKey={listResetKey}
          >
            {(visibleEvents) => (
              <div className={styles.eventsList} data-view={viewMode}>
                {visibleEvents.map((event) => {
                  const detailsEvent = eventToDetailsEvent(event);

                  return (
                    <EventDetailsCardTrigger
                      ariaLabel={`Открыть детали ${event.title}`}
                      className={styles.eventListCard}
                      event={detailsEvent}
                      key={event.id}
                      testId="event-card"
                    >
                      <Image
                        alt=""
                        className={styles.eventListImage}
                        height={142}
                        src={event.imageSrc}
                        width={220}
                      />
                      <div className={styles.eventListMain}>
                        <span className={styles.eventListBadge}>{event.badge}</span>
                        <h2>{event.title}</h2>
                        <p>
                          <MapPin aria-hidden size={16} />
                          {event.venueName}
                        </p>
                        <p className={styles.eventListAddress}>{event.address}</p>
                        <p className={styles.eventListDescription}>{event.description}</p>
                      </div>

                      <div className={styles.eventListDetails}>
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
                          Возраст: <strong>{event.ageRange}</strong>
                        </span>
                      </div>

                      <div className={styles.eventListActions}>
                        <strong>{event.priceLabel}</strong>
                      </div>
                    </EventDetailsCardTrigger>
                  );
                })}
              </div>
            )}
          </LoadMore>
        </div>

        <EventMap events={filteredEvents.length ? filteredEvents : profileEvents} />
      </div>
    </section>
  );
}
