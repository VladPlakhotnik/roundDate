"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Clock3,
  Edit3,
  Eye,
  ImagePlus,
  MapPinned,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Upload,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { AdminCard } from "@/admin/components/AdminCard";
import { AdminBadge, type AdminBadgeTone } from "@/admin/components/AdminBadge";
import { AdminColumnVisibility } from "@/admin/components/AdminColumnVisibility";
import { AdminTable } from "@/admin/components/AdminTable";
import { getDefaultVisibleAdminColumnIds } from "@/admin/lib/default-visible-columns";
import { getEventRowActions, getScheduledPublishDateTime } from "@/admin/server/event-workflow";
import type { AdminEventFilters, AdminEventListItem, AdminEventOwner } from "@/admin/server/events";
import type { AdminVenueListItem } from "@/admin/server/venues";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Button } from "@/shared/ui/Button";
import { DatePicker } from "@/shared/ui/DatePicker";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { Select } from "@/shared/ui/Select";

import { AdminVenueMapPicker, type AdminVenueMapValue } from "./AdminVenueMapPicker";
import styles from "./AdminEventsView.module.css";

type AdminEventsViewProps = {
  admins: AdminEventOwner[];
  createEventAction: (formData: FormData) => Promise<void>;
  currentAdminId: string;
  deleteEventAction: (formData: FormData) => Promise<void>;
  events: AdminEventListItem[];
  filters: AdminEventFilters;
  publishEventAction: (formData: FormData) => Promise<void>;
  updateEventAction: (formData: FormData) => Promise<void>;
  venues: AdminVenueListItem[];
};

type CoverAsset = {
  label: string;
  src: string;
};

type VenueDraft = {
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  mode: "existing" | "manual" | "map";
  name: string;
};

type AddressMode = "existing" | "manual";
type AddressLookupStatus = "fallback" | "idle" | "loading";

type ReverseGeocodeResponse = {
  address?: string;
  city?: string;
  district?: string;
  name?: string;
};

const coverAssets: CoverAsset[] = [
  { label: "Столик с карточкой", src: "/assets/home-events/chairs-date.png" },
  { label: "Круглый стол", src: "/assets/home-events/chairs-flowers.png" },
  { label: "Коралловые кресла", src: "/assets/home-events/chairs-coral.png" },
  { label: "Пара за столом", src: "/assets/why-better/couple-scene-v2.png" },
  { label: "Публичное место", src: "/assets/why-better/cafe-place-v2.png" },
  { label: "Атмосфера вечера", src: "/assets/atmosphere/gdansk-evening.png" },
];

const fallbackVenue: VenueDraft = {
  address: "ul. Chlebnicka 10/11, Gdansk",
  city: "Gdansk",
  district: "Stare Miasto",
  latitude: 54.3464,
  longitude: 18.6533,
  mode: "manual",
  name: "Restaurant&Bar Stary Spichlerz",
};

const addressLookupLabels: Record<AddressLookupStatus, string> = {
  fallback: "Не удалось определить улицу автоматически. Уточните адрес вручную.",
  idle: "",
  loading: "Определяем улицу по точке на карте...",
};

const statusLabels: Record<AdminEventListItem["status"], string> = {
  cancelled: "Отменено",
  draft: "Черновик",
  finished: "Завершено",
  published: "Опубликовано",
  sold_out: "Sold out",
};

const statusTones: Record<AdminEventListItem["status"], AdminBadgeTone> = {
  cancelled: "danger",
  draft: "neutral",
  finished: "warning",
  published: "success",
  sold_out: "warning",
};

const eventTableColumns = [
  { id: "event", label: "Мероприятие" },
  { id: "date", label: "Дата" },
  { id: "status", label: "Статус" },
  { id: "spots", label: "Места" },
  { id: "price", label: "Цена" },
  { id: "address", label: "Адрес" },
  { id: "publication", label: "Публикация" },
  { id: "actions", label: "Action" },
] as const;

type EventTableColumnId = (typeof eventTableColumns)[number]["id"];
const defaultEventTableColumnIds = getDefaultVisibleAdminColumnIds(eventTableColumns, [
  "price",
  "address",
  "publication",
]);
const eventTableColumnStorageKey = "admin.events.table.columns";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPrice(groszy: number) {
  return new Intl.NumberFormat("ru-RU", {
    currency: "PLN",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(groszy / 100);
}

function getDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getTimeInputValue(date: Date) {
  return date.toISOString().slice(11, 16);
}

function getPublishModeFromEvent(event: AdminEventListItem) {
  if (event.publishState.state === "scheduled") {
    return "scheduled";
  }

  if (event.status === "published") {
    return "now";
  }

  return "draft";
}

function getOwnerLabel(owner: AdminEventOwner) {
  return [owner.firstName, owner.lastName].filter(Boolean).join(" ") || owner.name || owner.email;
}

function getDefaultVenue(venues: AdminVenueListItem[]): VenueDraft {
  const venue = venues[0];

  if (!venue) {
    return fallbackVenue;
  }

  return {
    address: venue.address,
    city: venue.city,
    district: venue.district,
    latitude: venue.latitude ?? fallbackVenue.latitude,
    longitude: venue.longitude ?? fallbackVenue.longitude,
    mode: "existing",
    name: venue.name,
  };
}

function readMetadataNumber(
  metadata: Record<string, unknown> | null,
  key: "latitude" | "longitude",
) {
  const value = metadata?.[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  return undefined;
}

function getEventVenueDraft(
  event: AdminEventListItem,
  venues: AdminVenueListItem[],
): {
  addressMode: AddressMode;
  selectedVenueId: string;
  venue: VenueDraft;
} {
  const matchedVenue = venues.find((item) => item.id === event.venueId);

  if (matchedVenue) {
    return {
      addressMode: "existing" as AddressMode,
      selectedVenueId: matchedVenue.id,
      venue: {
        address: matchedVenue.address,
        city: matchedVenue.city,
        district: matchedVenue.district,
        latitude: matchedVenue.latitude ?? fallbackVenue.latitude,
        longitude: matchedVenue.longitude ?? fallbackVenue.longitude,
        mode: "existing" as const,
        name: matchedVenue.name,
      },
    };
  }

  const metadataMode = event.metadata?.addressMode;
  const venueMode: VenueDraft["mode"] =
    metadataMode === "map" ? "map" : metadataMode === "manual" ? "manual" : "existing";

  return {
    addressMode: venueMode === "existing" && event.venueId ? "existing" : "manual",
    selectedVenueId: venueMode === "existing" ? (event.venueId ?? "") : "",
    venue: {
      address: event.venueAddress ?? event.city,
      city: event.city,
      district: event.venueDistrict ?? fallbackVenue.district,
      latitude:
        event.venueLatitude ??
        readMetadataNumber(event.metadata, "latitude") ??
        fallbackVenue.latitude,
      longitude:
        event.venueLongitude ??
        readMetadataNumber(event.metadata, "longitude") ??
        fallbackVenue.longitude,
      mode: venueMode,
      name: event.venueName ?? fallbackVenue.name,
    },
  };
}

function getDefaultDate() {
  const date = new Date();

  date.setDate(date.getDate() + 14);

  return date.toISOString().slice(0, 10);
}

function FormField({
  children,
  className,
  isRequired,
  label,
}: {
  children: ReactNode;
  className?: string;
  isRequired?: boolean;
  label: string;
}) {
  return (
    <div className={[styles.formField, className].filter(Boolean).join(" ")}>
      <span>
        {label}
        {isRequired ? " *" : ""}
      </span>
      {children}
    </div>
  );
}

function DatePickerField({
  label,
  maxYear,
  minYear,
  name,
  onChange,
  value,
}: {
  label: string;
  maxYear?: number;
  minYear?: number;
  name?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const yearBounds = {
    ...(maxYear !== undefined ? { maxYear } : {}),
    ...(minYear !== undefined ? { minYear } : {}),
  };

  return (
    <DatePicker
      className={styles.datePicker ?? ""}
      label={label}
      {...yearBounds}
      {...(name ? { name } : {})}
      value={value}
      onChange={onChange}
    />
  );
}

function TimePickerField({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <DatePicker
      className={styles.datePicker ?? ""}
      kind="time"
      label={label}
      {...(name ? { name } : {})}
      value={value}
      onChange={onChange}
    />
  );
}

export function AdminEventsView({
  admins,
  createEventAction,
  currentAdminId,
  deleteEventAction,
  events,
  filters,
  publishEventAction,
  updateEventAction,
  venues,
}: AdminEventsViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hasMountedRef = useRef(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCoverOpen, setIsCoverOpen] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<AdminEventListItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<AdminEventListItem | null>(null);
  const [publishingEvent, setPublishingEvent] = useState<AdminEventListItem | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<AdminEventListItem | null>(null);
  const returnToCreateAfterCoverRef = useRef(false);
  const returnToCreateAfterAddressRef = useRef(false);
  const returnToEditAfterCoverRef = useRef(false);
  const returnToEditAfterAddressRef = useRef(false);
  const preserveCreateDialogRef = useRef(false);
  const preserveEditDialogRef = useRef(false);
  const addressLookupRequestRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverTab, setCoverTab] = useState<"library" | "upload">("library");
  const [coverSrc, setCoverSrc] = useState(coverAssets[0]!.src);
  const [eventDate, setEventDate] = useState(getDefaultDate);
  const [eventTime, setEventTime] = useState("19:00");
  const [publicationMode, setPublicationMode] = useState("draft");
  const [publishDate, setPublishDate] = useState(getDefaultDate);
  const [publishTime, setPublishTime] = useState("09:00");
  const [rowPublishMode, setRowPublishMode] = useState("now");
  const [rowPublishDate, setRowPublishDate] = useState(getDefaultDate);
  const [rowPublishTime, setRowPublishTime] = useState("09:00");
  const [adminUserId, setAdminUserId] = useState(currentAdminId);
  const [editStatus, setEditStatus] = useState("draft");
  const [editDate, setEditDate] = useState(getDefaultDate);
  const [editTime, setEditTime] = useState("19:00");
  const [editPublicationMode, setEditPublicationMode] = useState("draft");
  const [editPublishDate, setEditPublishDate] = useState(getDefaultDate);
  const [editPublishTime, setEditPublishTime] = useState("09:00");
  const [editAdminUserId, setEditAdminUserId] = useState(currentAdminId);
  const [query, setQuery] = useState(filters.q);
  const debouncedQuery = useDebounce(query, 320);
  const [eventStatusFilter, setEventStatusFilter] = useState(filters.status);
  const [visibleEventColumnIds, setVisibleEventColumnIds] = useState<string[]>(() => [
    ...defaultEventTableColumnIds,
  ]);
  const [selectedVenueId, setSelectedVenueId] = useState(venues[0]?.id ?? "");
  const [addressMode, setAddressMode] = useState<AddressMode>(
    venues.length > 0 ? "existing" : "manual",
  );
  const [venue, setVenue] = useState<VenueDraft>(() => getDefaultVenue(venues));
  const [venueSearch, setVenueSearch] = useState("");
  const [addressLookupStatus, setAddressLookupStatus] = useState<AddressLookupStatus>("idle");
  const adminDatePickerMinYear = new Date().getFullYear() - 1;
  const adminDatePickerMaxYear = new Date().getFullYear() + 10;
  const selectedCover = coverAssets.find((asset) => asset.src === coverSrc);
  const visibleEventColumnSet = new Set(visibleEventColumnIds);
  const hasFilters = Boolean(filters.q || filters.status !== "all");
  const filteredVenues = useMemo(() => {
    const query = venueSearch.trim().toLowerCase();

    if (!query) {
      return venues;
    }

    return venues.filter((item) =>
      [item.name, item.address, item.city, item.district].join(" ").toLowerCase().includes(query),
    );
  }, [venueSearch, venues]);

  function isEventColumnVisible(columnId: EventTableColumnId) {
    return visibleEventColumnSet.has(columnId);
  }

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const params = new URLSearchParams();
    const nextQuery = debouncedQuery.trim();

    if (nextQuery.length >= 2) {
      params.set("q", nextQuery.slice(0, 120));
    }

    if (eventStatusFilter !== "all") {
      params.set("status", eventStatusFilter);
    }

    const nextUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [debouncedQuery, eventStatusFilter, pathname, router]);

  function readUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        setCoverSrc(reader.result);
      }
    });
    reader.readAsDataURL(file);
  }

  async function reverseGeocodeVenue(point: AdminVenueMapValue) {
    const params = new URLSearchParams({
      lat: String(point.latitude),
      lon: String(point.longitude),
    });
    const response = await fetch(`/api/geocoding/reverse?${params.toString()}`);

    if (!response.ok) {
      return undefined;
    }

    return (await response.json()) as ReverseGeocodeResponse;
  }

  function selectVenue(item: AdminVenueListItem) {
    setSelectedVenueId(item.id);
    setAddressMode("existing");
    setAddressLookupStatus("idle");
    setVenue({
      address: item.address,
      city: item.city,
      district: item.district,
      latitude: item.latitude ?? fallbackVenue.latitude,
      longitude: item.longitude ?? fallbackVenue.longitude,
      mode: "existing",
      name: item.name,
    });
  }

  function resetVenue() {
    setSelectedVenueId(venues[0]?.id ?? "");
    setAddressMode(venues[0] ? "existing" : "manual");
    setAddressLookupStatus("idle");
    setVenue(getDefaultVenue(venues));
  }

  function switchAddressMode(nextMode: AddressMode) {
    setAddressMode(nextMode);
    setAddressLookupStatus("idle");

    if (nextMode === "existing") {
      const selectedVenue = venues.find((item) => item.id === selectedVenueId) ?? venues[0];

      if (selectedVenue) {
        selectVenue(selectedVenue);
      }

      return;
    }

    setSelectedVenueId("");
    setVenue((current) => ({
      ...current,
      mode: current.mode === "existing" ? "manual" : current.mode,
    }));
  }

  function resetCreateDraft() {
    setCoverTab("library");
    setCoverSrc(coverAssets[0]!.src);
    setEventDate(getDefaultDate());
    setEventTime("19:00");
    setPublicationMode("draft");
    setPublishDate(getDefaultDate());
    setPublishTime("09:00");
    setAdminUserId(currentAdminId);
    setVenueSearch("");
    resetVenue();
  }

  function openCreateModal() {
    resetCreateDraft();
    setIsCreateOpen(true);
  }

  function openCoverPicker(target: "create" | "edit") {
    if (target === "edit") {
      returnToEditAfterCoverRef.current = true;
      preserveEditDialogRef.current = true;
    } else {
      returnToCreateAfterCoverRef.current = true;
      preserveCreateDialogRef.current = true;
    }

    setIsCoverOpen(true);
  }

  function closeCoverPicker() {
    setIsCoverOpen(false);
    handleCoverOpenChange(false);
  }

  function openAddressPicker() {
    returnToCreateAfterAddressRef.current = true;
    preserveCreateDialogRef.current = true;
    setIsAddressOpen(true);
  }

  function openEditAddressPicker() {
    returnToEditAfterAddressRef.current = true;
    preserveEditDialogRef.current = true;
    setIsAddressOpen(true);
  }

  function closeAddressPicker() {
    setIsAddressOpen(false);
    handleAddressOpenChange(false);
  }

  function handleCoverOpenChange(isOpen: boolean) {
    setIsCoverOpen(isOpen);

    if (!isOpen && returnToCreateAfterCoverRef.current) {
      returnToCreateAfterCoverRef.current = false;
      setIsCreateOpen(true);
      window.setTimeout(() => {
        preserveCreateDialogRef.current = false;
      });
    }

    if (!isOpen && returnToEditAfterCoverRef.current) {
      returnToEditAfterCoverRef.current = false;
      window.setTimeout(() => {
        preserveEditDialogRef.current = false;
      });
    }
  }

  function handleAddressOpenChange(isOpen: boolean) {
    setIsAddressOpen(isOpen);

    if (!isOpen && returnToCreateAfterAddressRef.current) {
      returnToCreateAfterAddressRef.current = false;
      setIsCreateOpen(true);
      window.setTimeout(() => {
        preserveCreateDialogRef.current = false;
      });
    }

    if (!isOpen && returnToEditAfterAddressRef.current) {
      returnToEditAfterAddressRef.current = false;
      window.setTimeout(() => {
        preserveEditDialogRef.current = false;
      });
    }
  }

  function handleCreateOpenChange(isOpen: boolean) {
    if (
      !isOpen &&
      (isCoverOpen ||
        isAddressOpen ||
        preserveCreateDialogRef.current ||
        returnToCreateAfterCoverRef.current ||
        returnToCreateAfterAddressRef.current)
    ) {
      return;
    }

    setIsCreateOpen(isOpen);
  }

  function handleEditOpenChange(isOpen: boolean) {
    if (
      !isOpen &&
      (isCoverOpen ||
        isAddressOpen ||
        preserveEditDialogRef.current ||
        returnToEditAfterCoverRef.current ||
        returnToEditAfterAddressRef.current)
    ) {
      return;
    }

    if (!isOpen) {
      setEditingEvent(null);
    }
  }

  function updateVenueField(
    key: keyof Pick<VenueDraft, "address" | "city" | "district" | "name">,
    value: string,
  ) {
    setSelectedVenueId("");
    setAddressMode("manual");
    setAddressLookupStatus("idle");
    setVenue((current) => ({ ...current, [key]: value, mode: "manual" }));
  }

  async function handleMapChange(nextValue: AdminVenueMapValue) {
    const requestId = addressLookupRequestRef.current + 1;
    addressLookupRequestRef.current = requestId;
    setSelectedVenueId("");
    setAddressMode("manual");
    setAddressLookupStatus("loading");
    setVenue((current) => ({
      ...current,
      latitude: nextValue.latitude,
      longitude: nextValue.longitude,
      mode: "map",
      name: current.mode === "manual" && current.name ? current.name : "Новая площадка",
    }));

    try {
      const geocodedVenue = await reverseGeocodeVenue(nextValue);

      if (addressLookupRequestRef.current !== requestId) {
        return;
      }

      setVenue((current) => ({
        ...current,
        address: geocodedVenue?.address || "Адрес уточняется вручную",
        city: geocodedVenue?.city || current.city || fallbackVenue.city,
        district: geocodedVenue?.district || current.district || fallbackVenue.district,
        latitude: nextValue.latitude,
        longitude: nextValue.longitude,
        mode: "map",
        name: geocodedVenue?.name || current.name || "Новая площадка",
      }));
      setAddressLookupStatus(geocodedVenue?.address ? "idle" : "fallback");
    } catch {
      if (addressLookupRequestRef.current !== requestId) {
        return;
      }

      setVenue((current) => ({
        ...current,
        address: "Адрес уточняется вручную",
        latitude: nextValue.latitude,
        longitude: nextValue.longitude,
        mode: "map",
      }));
      setAddressLookupStatus("fallback");
    }
  }

  function openPublishModal(event: AdminEventListItem) {
    const scheduled = getScheduledPublishDateTime(event.publishState.publishAt);

    setPublishingEvent(event);
    setRowPublishMode(event.publishState.state === "scheduled" ? "scheduled" : "now");
    setRowPublishDate(scheduled.date || getDefaultDate());
    setRowPublishTime(scheduled.time || "09:00");
  }

  function openEditModal(event: AdminEventListItem) {
    const startsAt = new Date(event.startsAt);
    const scheduled = getScheduledPublishDateTime(event.publishState.publishAt);
    const nextVenue = getEventVenueDraft(event, venues);

    setCoverTab("library");
    setCoverSrc(event.imageSrc ?? "");
    setSelectedVenueId(nextVenue.selectedVenueId);
    setAddressMode(nextVenue.addressMode);
    setVenue(nextVenue.venue);
    setVenueSearch("");
    setAddressLookupStatus("idle");
    setEditingEvent(event);
    setEditDate(getDateInputValue(startsAt));
    setEditTime(getTimeInputValue(startsAt));
    setEditStatus(event.status);
    setEditPublicationMode(getPublishModeFromEvent(event));
    setEditPublishDate(scheduled.date || getDefaultDate());
    setEditPublishTime(scheduled.time || "09:00");
    setEditAdminUserId(event.adminUserId ?? currentAdminId);
  }

  return (
    <div className={styles.page}>
      <AdminCard className={styles.headerCard}>
        <AdminCard.Content className={styles.headerContent}>
          <div>
            <AdminBadge size="sm" tone="neutral">
              Admin workspace
            </AdminBadge>
            <h1>Мероприятия</h1>
            <p>
              Создавайте события, назначайте администраторов, выбирайте обложку и привязывайте
              площадку из общей базы адресов.
            </p>
          </div>
          <Button
            className={styles.primaryButton}
            leftIcon={<Plus aria-hidden size={18} strokeWidth={2.2} />}
            size="lg"
            onClick={openCreateModal}
          >
            Создать мероприятие
          </Button>
        </AdminCard.Content>
      </AdminCard>

      <div className={styles.statsGrid}>
        <AdminCard className={styles.panel}>
          <AdminCard.Content className={styles.statCard}>
            <CalendarDays aria-hidden size={22} />
            <span>
              <small>Всего событий</small>
              <strong>{events.length}</strong>
            </span>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard className={styles.panel}>
          <AdminCard.Content className={styles.statCard}>
            <UsersRound aria-hidden size={22} />
            <span>
              <small>Активные</small>
              <strong>{events.filter((event) => event.status === "published").length}</strong>
            </span>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard className={styles.panel}>
          <AdminCard.Content className={styles.statCard}>
            <MapPinned aria-hidden size={22} />
            <span>
              <small>Площадки</small>
              <strong>{venues.length}</strong>
            </span>
          </AdminCard.Content>
        </AdminCard>
      </div>

      <AdminCard className={styles.panel}>
        <AdminCard.Content>
          <div className={styles.filters}>
            <Input
              className={styles.searchField}
              label="Поиск"
              leftIcon={<Search aria-hidden size={17} strokeWidth={2.2} />}
              minLength={2}
              name="q"
              placeholder="Название, slug, город или адрес"
              size="sm"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            <Select
              label="Статус"
              name="status"
              options={[
                { label: "Все статусы", value: "all" },
                { label: statusLabels.draft, value: "draft" },
                { label: statusLabels.published, value: "published" },
                { label: statusLabels.finished, value: "finished" },
                { label: statusLabels.sold_out, value: "sold_out" },
                { label: statusLabels.cancelled, value: "cancelled" },
              ]}
              size="sm"
              value={eventStatusFilter}
              onChange={(value) => setEventStatusFilter(value as typeof eventStatusFilter)}
            />
            <AdminColumnVisibility
              columns={eventTableColumns}
              storageKey={eventTableColumnStorageKey}
              visibleColumnIds={visibleEventColumnIds}
              onVisibleColumnIdsChange={setVisibleEventColumnIds}
            />
            {hasFilters ? (
              <Link className={styles.resetLink} href="/admin/events">
                <RotateCcw aria-hidden size={16} strokeWidth={2.3} />
                Сбросить
              </Link>
            ) : null}
          </div>
        </AdminCard.Content>
      </AdminCard>

      <AdminCard className={styles.panel}>
        <AdminCard.Content>
          <div className={styles.tableShell}>
            <AdminTable.ScrollContainer>
              <AdminTable aria-label="Список мероприятий">
                <AdminTable.Header>
                  <AdminTable.Row>
                    {isEventColumnVisible("event") ? (
                      <AdminTable.Column isRowHeader>Мероприятие</AdminTable.Column>
                    ) : null}
                    {isEventColumnVisible("date") ? (
                      <AdminTable.Column>Дата</AdminTable.Column>
                    ) : null}
                    {isEventColumnVisible("status") ? (
                      <AdminTable.Column>Статус</AdminTable.Column>
                    ) : null}
                    {isEventColumnVisible("spots") ? (
                      <AdminTable.Column>Места</AdminTable.Column>
                    ) : null}
                    {isEventColumnVisible("price") ? (
                      <AdminTable.Column>Цена</AdminTable.Column>
                    ) : null}
                    {isEventColumnVisible("address") ? (
                      <AdminTable.Column>Адрес</AdminTable.Column>
                    ) : null}
                    {isEventColumnVisible("publication") ? (
                      <AdminTable.Column>Публикация</AdminTable.Column>
                    ) : null}
                    {isEventColumnVisible("actions") ? (
                      <AdminTable.Column>Action</AdminTable.Column>
                    ) : null}
                  </AdminTable.Row>
                </AdminTable.Header>
                <AdminTable.Body>
                  {events.map((event) => {
                    const actions = getEventRowActions({ status: event.status });

                    return (
                      <AdminTable.Row id={event.id} key={event.id}>
                        {isEventColumnVisible("event") ? (
                          <AdminTable.Cell>
                            <div className={styles.eventCell}>
                              {event.imageSrc ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt="" src={event.imageSrc} />
                              ) : (
                                <span>
                                  <ImagePlus aria-hidden size={18} />
                                </span>
                              )}
                              <div>
                                <strong>{event.title}</strong>
                                <small>{event.slug}</small>
                              </div>
                            </div>
                          </AdminTable.Cell>
                        ) : null}
                        {isEventColumnVisible("date") ? (
                          <AdminTable.Cell>{formatDate(event.startsAt)}</AdminTable.Cell>
                        ) : null}
                        {isEventColumnVisible("status") ? (
                          <AdminTable.Cell>
                            <AdminBadge size="sm" tone={statusTones[event.status]}>
                              {statusLabels[event.status]}
                            </AdminBadge>
                          </AdminTable.Cell>
                        ) : null}
                        {isEventColumnVisible("spots") ? (
                          <AdminTable.Cell>
                            {event.spotsAvailable}/{event.capacityTotal}
                            <small className={styles.muted}>
                              Девушки: {event.femaleSpotsAvailable}, парни:{" "}
                              {event.maleSpotsAvailable}
                            </small>
                          </AdminTable.Cell>
                        ) : null}
                        {isEventColumnVisible("price") ? (
                          <AdminTable.Cell>{formatPrice(event.priceGroszy)}</AdminTable.Cell>
                        ) : null}
                        {isEventColumnVisible("address") ? (
                          <AdminTable.Cell>
                            <span className={styles.addressCell}>
                              {event.venueName ?? "Площадка не указана"}
                              <small>{event.venueAddress ?? event.city}</small>
                            </span>
                          </AdminTable.Cell>
                        ) : null}
                        {isEventColumnVisible("publication") ? (
                          <AdminTable.Cell>
                            <span className={styles.publishState}>
                              <AdminBadge
                                size="sm"
                                tone={
                                  event.publishState.state === "scheduled"
                                    ? "warning"
                                    : statusTones[event.status]
                                }
                              >
                                {event.publishState.label}
                              </AdminBadge>
                              {event.publishState.publishAt ? (
                                <small>{formatDate(new Date(event.publishState.publishAt))}</small>
                              ) : null}
                            </span>
                          </AdminTable.Cell>
                        ) : null}
                        {isEventColumnVisible("actions") ? (
                          <AdminTable.Cell>
                            <div className={styles.actionsCell}>
                              {actions.includes("publish") ? (
                                <Button
                                  aria-label={`Опубликовать ${event.title}`}
                                  className={styles.iconAction}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openPublishModal(event)}
                                >
                                  <Send aria-hidden size={16} />
                                </Button>
                              ) : null}
                              <Button
                                aria-label={`Открыть ${event.title}`}
                                className={styles.iconAction}
                                size="sm"
                                variant="outline"
                                onClick={() => setDetailsEvent(event)}
                              >
                                <Eye aria-hidden size={16} />
                              </Button>
                              <Button
                                aria-label={`Изменить ${event.title}`}
                                className={styles.iconAction}
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(event)}
                              >
                                <Edit3 aria-hidden size={16} />
                              </Button>
                              <Button
                                aria-label={`Удалить ${event.title}`}
                                className={[styles.iconAction, styles.dangerAction].join(" ")}
                                size="sm"
                                variant="outline"
                                onClick={() => setDeletingEvent(event)}
                              >
                                <Trash2 aria-hidden size={16} />
                              </Button>
                            </div>
                          </AdminTable.Cell>
                        ) : null}
                      </AdminTable.Row>
                    );
                  })}
                </AdminTable.Body>
              </AdminTable>
            </AdminTable.ScrollContainer>
          </div>
        </AdminCard.Content>
      </AdminCard>

      <Modal
        contentClassName={styles.createDialog}
        open={isCreateOpen}
        size="xl"
        title="Создание мероприятия"
        onOpenChange={handleCreateOpenChange}
      >
        <form className={styles.modalForm} action={createEventAction}>
          <input name="coverSrc" type="hidden" value={coverSrc} />
          <input name="date" type="hidden" value={eventDate} />
          <input name="time" type="hidden" value={eventTime} />
          <input name="venueId" type="hidden" value={selectedVenueId} />
          <input name="venueName" type="hidden" value={venue.name} />
          <input name="venueAddress" type="hidden" value={venue.address} />
          <input name="city" type="hidden" value={venue.city} />
          <input name="district" type="hidden" value={venue.district} />
          <input name="latitude" type="hidden" value={venue.latitude} />
          <input name="longitude" type="hidden" value={venue.longitude} />
          <input name="addressMode" type="hidden" value={venue.mode} />

          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              <div className={styles.sidePanel}>
                <AdminCard className={styles.coverPreview}>
                  <AdminCard.Content>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" src={coverSrc} />
                    <div>
                      <strong>{selectedCover?.label ?? "Загруженная обложка"}</strong>
                      <Button
                        leftIcon={<ImagePlus aria-hidden size={16} />}
                        size="sm"
                        variant="outline"
                        onClick={() => openCoverPicker("create")}
                      >
                        Выбрать обложку
                      </Button>
                    </div>
                  </AdminCard.Content>
                </AdminCard>

                <AdminCard className={styles.addressSummary}>
                  <AdminCard.Content className={styles.addressSummaryContent}>
                    <MapPinned aria-hidden size={20} />
                    <div>
                      <strong>{venue.name}</strong>
                      <small>{venue.address}</small>
                      <small>
                        {venue.city} · {venue.district}
                      </small>
                    </div>
                    <Button size="sm" variant="outline" onClick={openAddressPicker}>
                      Выбрать адрес
                    </Button>
                  </AdminCard.Content>
                </AdminCard>
              </div>

              <div className={styles.fieldsGrid}>
                <FormField isRequired label="Название">
                  <Input name="title" placeholder="RoundDate 25-35" />
                </FormField>
                <FormField label="Бейдж">
                  <Input name="badge" placeholder="Идет набор" />
                </FormField>
                <FormField label="Описание">
                  <textarea
                    className={styles.textarea}
                    name="description"
                    placeholder="Камерный вечер быстрых знакомств..."
                  />
                </FormField>
                <div className={styles.twoColumns}>
                  <DatePickerField
                    label="Дата"
                    maxYear={adminDatePickerMaxYear}
                    minYear={adminDatePickerMinYear}
                    value={eventDate}
                    onChange={setEventDate}
                  />
                  <TimePickerField label="Время" value={eventTime} onChange={setEventTime} />
                </div>
                <div className={styles.twoColumns}>
                  <FormField label="Возраст от">
                    <Input name="ageMin" placeholder="25" type="number" />
                  </FormField>
                  <FormField label="Возраст до">
                    <Input name="ageMax" placeholder="35" type="number" />
                  </FormField>
                </div>
                <div className={styles.twoColumns}>
                  <FormField label="Мест для девушек">
                    <Input name="femaleCapacity" placeholder="8" type="number" />
                  </FormField>
                  <FormField label="Мест для парней">
                    <Input name="maleCapacity" placeholder="8" type="number" />
                  </FormField>
                </div>
                <div className={styles.twoColumns}>
                  <FormField label="Цена, PLN">
                    <Input name="price" placeholder="129" type="number" />
                  </FormField>
                  <FormField label="Язык">
                    <Input name="language" placeholder="RU/PL" />
                  </FormField>
                </div>
                <div className={styles.twoColumns}>
                  <FormField label="Длительность, мин">
                    <Input name="durationMinutes" placeholder="120" type="number" />
                  </FormField>
                  <FormField label="Раунд, мин">
                    <Input name="conversationMinutes" placeholder="10" type="number" />
                  </FormField>
                </div>

                <Select
                  label="Публикация"
                  name="publicationMode"
                  options={[
                    { label: "Сохранить как черновик", value: "draft" },
                    { label: "Опубликовать сейчас", value: "now" },
                    { label: "Запланировать публикацию", value: "scheduled" },
                  ]}
                  value={publicationMode}
                  onChange={setPublicationMode}
                />

                {publicationMode === "scheduled" ? (
                  <div className={styles.twoColumns}>
                    <DatePickerField
                      label="Дата публикации"
                      maxYear={adminDatePickerMaxYear}
                      minYear={adminDatePickerMinYear}
                      name="publishDate"
                      value={publishDate}
                      onChange={setPublishDate}
                    />
                    <TimePickerField
                      label="Время публикации"
                      name="publishTime"
                      value={publishTime}
                      onChange={setPublishTime}
                    />
                  </div>
                ) : null}

                <Select
                  label="Администратор"
                  name="adminUserId"
                  options={admins.map((owner) => ({
                    label: `${getOwnerLabel(owner)} · ${owner.email}`,
                    value: owner.id,
                  }))}
                  value={adminUserId}
                  onChange={setAdminUserId}
                />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Отмена
            </Button>
            <Button className={styles.primaryButton} type="submit">
              Создать мероприятие
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        className={styles.coverDialogBody}
        contentClassName={styles.nestedDialog}
        modal={false}
        open={isCoverOpen}
        overlayClassName={styles.nestedBackdrop}
        size="lg"
        title="Обложка мероприятия"
        onOpenChange={handleCoverOpenChange}
      >
        <div
          className={styles.coverScrollArea}
          onTouchMoveCapture={(event) => event.stopPropagation()}
          onWheelCapture={(event) => event.stopPropagation()}
        >
          <div className={styles.modalBody}>
            <div className={styles.tabs}>
              <button
                aria-pressed={coverTab === "library"}
                type="button"
                onClick={() => setCoverTab("library")}
              >
                Библиотека
              </button>
              <button
                aria-pressed={coverTab === "upload"}
                type="button"
                onClick={() => setCoverTab("upload")}
              >
                Загрузить файл
              </button>
            </div>

            {coverTab === "library" ? (
              <div className={styles.assetGrid}>
                {coverAssets.map((asset) => (
                  <Button
                    className={styles.assetButton}
                    key={asset.src}
                    aria-pressed={coverSrc === asset.src}
                    variant="outline"
                    onClick={() => setCoverSrc(asset.src)}
                  >
                    <span className={styles.assetImageFrame}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" src={asset.src} />
                    </span>
                    <span className={styles.assetLabel}>{asset.label}</span>
                  </Button>
                ))}
              </div>
            ) : null}
            {coverTab === "upload" ? (
              <AdminCard className={styles.uploadBox}>
                <AdminCard.Content>
                  <Upload aria-hidden size={30} />
                  <strong>Загрузить обложку с компьютера</strong>
                  <p>PNG, JPG или WEBP. Сейчас файл сохраняется как data URL для прототипа.</p>
                  <input
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    type="file"
                    onChange={(event) => readUpload(event.currentTarget.files?.[0])}
                  />
                  <Button
                    className={styles.primaryButton}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Выбрать файл
                  </Button>
                </AdminCard.Content>
              </AdminCard>
            ) : null}
          </div>
          <div className={styles.modalFooter}>
            <Button className={styles.primaryButton} onClick={closeCoverPicker}>
              Готово
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        contentClassName={styles.addressDialog}
        modal={false}
        open={isAddressOpen}
        overlayClassName={styles.nestedBackdrop}
        size="xl"
        title="Адрес мероприятия"
        onOpenChange={handleAddressOpenChange}
      >
        <div className={styles.addressModeTabs} aria-label="Режим выбора адреса" role="group">
          <button
            aria-pressed={addressMode === "existing"}
            type="button"
            onClick={() => switchAddressMode("existing")}
          >
            Из базы адресов
          </button>
          <button
            aria-pressed={addressMode === "manual"}
            type="button"
            onClick={() => switchAddressMode("manual")}
          >
            Новый адрес
          </button>
        </div>
        <div
          className={[
            styles.addressModal,
            addressMode === "manual" ? styles.addressModalManual : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {addressMode === "existing" ? (
            <div className={styles.addressSearch}>
              <Input
                label="Поиск в базе адресов"
                leftIcon={<Search aria-hidden size={16} />}
                placeholder="Название площадки, улица или район"
                value={venueSearch}
                onChange={(event) => setVenueSearch(event.currentTarget.value)}
              />
              <div className={styles.suggestionList}>
                {filteredVenues.map((item) => (
                  <Button
                    className={styles.suggestionButton}
                    key={item.id}
                    aria-pressed={selectedVenueId === item.id}
                    variant="outline"
                    onClick={() => selectVenue(item)}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.address}</span>
                  </Button>
                ))}
                {filteredVenues.length === 0 ? (
                  <div className={styles.emptyVenues}>
                    <strong>Адрес не найден</strong>
                    <span>Переключитесь на новый адрес, чтобы добавить площадку вручную.</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className={styles.manualAddress}>
            <AdminVenueMapPicker
              isInteractive={addressMode === "manual"}
              value={{ latitude: venue.latitude, longitude: venue.longitude }}
              {...(addressMode === "manual" ? { onChange: handleMapChange } : {})}
            />
            {addressMode === "existing" ? (
              <div className={styles.selectedVenueCard}>
                <span>Выбранный адрес</span>
                <strong>{venue.name}</strong>
                <dl>
                  <div>
                    <dt>Адрес</dt>
                    <dd>{venue.address}</dd>
                  </div>
                  <div>
                    <dt>Город</dt>
                    <dd>{venue.city}</dd>
                  </div>
                  <div>
                    <dt>Район</dt>
                    <dd>{venue.district}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className={styles.addressDetailsSlot}>
                {addressLookupStatus === "loading" ? (
                  <div
                    aria-label="Определяем адрес"
                    aria-live="polite"
                    className={styles.addressLookupLoader}
                  >
                    <span aria-hidden />
                    <span aria-hidden />
                    <span aria-hidden />
                  </div>
                ) : (
                  <>
                    {addressLookupStatus === "fallback" ? (
                      <p
                        aria-live="polite"
                        className={styles.addressLookupStatus}
                        data-status={addressLookupStatus}
                      >
                        {addressLookupLabels[addressLookupStatus]}
                      </p>
                    ) : null}
                    <div className={styles.addressFields}>
                      <div className={styles.twoColumns}>
                        <FormField label="Название площадки">
                          <Input
                            value={venue.name}
                            onChange={(event) =>
                              updateVenueField("name", event.currentTarget.value)
                            }
                          />
                        </FormField>
                        <FormField label="Адрес">
                          <Input
                            value={venue.address}
                            onChange={(event) =>
                              updateVenueField("address", event.currentTarget.value)
                            }
                          />
                        </FormField>
                      </div>
                      <div className={styles.twoColumns}>
                        <FormField label="Город">
                          <Input
                            value={venue.city}
                            onChange={(event) =>
                              updateVenueField("city", event.currentTarget.value)
                            }
                          />
                        </FormField>
                        <FormField label="Район">
                          <Input
                            value={venue.district}
                            onChange={(event) =>
                              updateVenueField("district", event.currentTarget.value)
                            }
                          />
                        </FormField>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className={styles.modalFooter}>
          <Button variant="outline" onClick={resetVenue}>
            Сбросить
          </Button>
          <Button className={styles.primaryButton} onClick={closeAddressPicker}>
            Готово
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(publishingEvent)}
        size="sm"
        title="Публикация мероприятия"
        onOpenChange={(open) => {
          if (!open) {
            setPublishingEvent(null);
          }
        }}
      >
        {publishingEvent ? (
          <form className={styles.modalForm} action={publishEventAction}>
            <input name="eventId" type="hidden" value={publishingEvent.id} />
            <div className={styles.modalBody}>
              <div className={styles.compactStack}>
                <strong>{publishingEvent.title}</strong>
                <span>Выберите, опубликовать мероприятие сразу или запланировать публикацию.</span>
              </div>
              <Select
                label="Когда публикуем"
                name="publicationMode"
                options={[
                  { label: "Опубликовать сейчас", value: "now" },
                  { label: "Запланировать", value: "scheduled" },
                ]}
                value={rowPublishMode}
                onChange={setRowPublishMode}
              />
              {rowPublishMode === "scheduled" ? (
                <div className={styles.twoColumns}>
                  <DatePickerField
                    label="Дата публикации"
                    maxYear={adminDatePickerMaxYear}
                    minYear={adminDatePickerMinYear}
                    name="publishDate"
                    value={rowPublishDate}
                    onChange={setRowPublishDate}
                  />
                  <TimePickerField
                    label="Время"
                    name="publishTime"
                    value={rowPublishTime}
                    onChange={setRowPublishTime}
                  />
                </div>
              ) : null}
            </div>
            <div className={styles.modalFooter}>
              <Button variant="outline" onClick={() => setPublishingEvent(null)}>
                Отмена
              </Button>
              <Button className={styles.primaryButton} type="submit">
                Сохранить публикацию
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        contentClassName={styles.detailsDialog}
        open={Boolean(detailsEvent)}
        size="lg"
        title="Детали мероприятия"
        onOpenChange={(open) => {
          if (!open) {
            setDetailsEvent(null);
          }
        }}
      >
        {detailsEvent ? (
          <div className={styles.detailsBody}>
            <div className={styles.detailsHero}>
              {detailsEvent.imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={detailsEvent.imageSrc} />
              ) : (
                <span>
                  <ImagePlus aria-hidden size={24} />
                </span>
              )}
              <div>
                <AdminBadge size="sm" tone={statusTones[detailsEvent.status]}>
                  {statusLabels[detailsEvent.status]}
                </AdminBadge>
                <h2>{detailsEvent.title}</h2>
                <p>{detailsEvent.description || "Описание мероприятия пока не заполнено."}</p>
              </div>
            </div>

            <div className={styles.detailsGrid}>
              <AdminCard>
                <AdminCard.Content className={styles.detailsMetric}>
                  <CalendarDays aria-hidden size={20} />
                  <span>
                    <small>Дата и время</small>
                    <strong>{formatDate(detailsEvent.startsAt)}</strong>
                  </span>
                </AdminCard.Content>
              </AdminCard>
              <AdminCard>
                <AdminCard.Content className={styles.detailsMetric}>
                  <MapPinned aria-hidden size={20} />
                  <span>
                    <small>Площадка</small>
                    <strong>{detailsEvent.venueName ?? "Не указана"}</strong>
                    <em>{detailsEvent.venueAddress ?? detailsEvent.city}</em>
                  </span>
                </AdminCard.Content>
              </AdminCard>
              <AdminCard>
                <AdminCard.Content className={styles.detailsMetric}>
                  <UsersRound aria-hidden size={20} />
                  <span>
                    <small>Места</small>
                    <strong>
                      {detailsEvent.spotsAvailable}/{detailsEvent.capacityTotal}
                    </strong>
                    <em>
                      Девушки: {detailsEvent.femaleSpotsAvailable}, парни:{" "}
                      {detailsEvent.maleSpotsAvailable}
                    </em>
                  </span>
                </AdminCard.Content>
              </AdminCard>
              <AdminCard>
                <AdminCard.Content className={styles.detailsMetric}>
                  <Clock3 aria-hidden size={20} />
                  <span>
                    <small>Формат</small>
                    <strong>
                      {detailsEvent.ageMin}-{detailsEvent.ageMax}
                    </strong>
                    <em>
                      {detailsEvent.durationMinutes} мин, раунд {detailsEvent.conversationMinutes}{" "}
                      мин
                    </em>
                  </span>
                </AdminCard.Content>
              </AdminCard>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        contentClassName={styles.createDialog}
        open={Boolean(editingEvent)}
        size="xl"
        title="Изменить мероприятие"
        onOpenChange={handleEditOpenChange}
      >
        {editingEvent ? (
          <form className={styles.modalForm} action={updateEventAction}>
            <input name="eventId" type="hidden" value={editingEvent.id} />
            <input name="coverSrc" type="hidden" value={coverSrc} />
            <input name="venueId" type="hidden" value={selectedVenueId} />
            <input name="venueName" type="hidden" value={venue.name} />
            <input name="venueAddress" type="hidden" value={venue.address} />
            <input name="city" type="hidden" value={venue.city} />
            <input name="district" type="hidden" value={venue.district} />
            <input name="latitude" type="hidden" value={venue.latitude} />
            <input name="longitude" type="hidden" value={venue.longitude} />
            <input name="addressMode" type="hidden" value={venue.mode} />
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.sidePanel}>
                  <AdminCard className={styles.coverPreview}>
                    <AdminCard.Content>
                      {coverSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" src={coverSrc} />
                      ) : (
                        <span className={styles.coverPlaceholder}>
                          <ImagePlus aria-hidden size={24} />
                        </span>
                      )}
                      <div>
                        <strong>
                          {selectedCover?.label ??
                            (coverSrc ? "Загруженная обложка" : "Обложка не выбрана")}
                        </strong>
                        <Button
                          leftIcon={<ImagePlus aria-hidden size={16} />}
                          size="sm"
                          variant="outline"
                          onClick={() => openCoverPicker("edit")}
                        >
                          Выбрать обложку
                        </Button>
                      </div>
                    </AdminCard.Content>
                  </AdminCard>
                  <AdminCard className={styles.addressSummary}>
                    <AdminCard.Content className={styles.addressSummaryContent}>
                      <MapPinned aria-hidden size={20} />
                      <div>
                        <strong>{venue.name}</strong>
                        <small>{venue.address}</small>
                        <small>
                          {venue.city} · {venue.district}
                        </small>
                      </div>
                      <Button size="sm" variant="outline" onClick={openEditAddressPicker}>
                        Выбрать адрес
                      </Button>
                    </AdminCard.Content>
                  </AdminCard>
                </div>

                <div className={styles.fieldsGrid}>
                  <FormField isRequired label="Название">
                    <Input defaultValue={editingEvent.title} name="title" />
                  </FormField>
                  <FormField label="Бейдж">
                    <Input defaultValue={editingEvent.badge ?? ""} name="badge" />
                  </FormField>
                  <FormField label="Описание">
                    <textarea
                      className={styles.textarea}
                      defaultValue={editingEvent.description ?? ""}
                      name="description"
                    />
                  </FormField>
                  <div className={styles.twoColumns}>
                    <DatePickerField
                      label="Дата"
                      maxYear={adminDatePickerMaxYear}
                      minYear={adminDatePickerMinYear}
                      name="date"
                      value={editDate}
                      onChange={setEditDate}
                    />
                    <TimePickerField
                      label="Время"
                      name="time"
                      value={editTime}
                      onChange={setEditTime}
                    />
                  </div>
                  <div className={styles.twoColumns}>
                    <FormField label="Возраст от">
                      <Input defaultValue={editingEvent.ageMin} name="ageMin" type="number" />
                    </FormField>
                    <FormField label="Возраст до">
                      <Input defaultValue={editingEvent.ageMax} name="ageMax" type="number" />
                    </FormField>
                  </div>
                  <div className={styles.twoColumns}>
                    <FormField label="Мест для девушек">
                      <Input
                        defaultValue={editingEvent.femaleCapacity}
                        name="femaleCapacity"
                        type="number"
                      />
                    </FormField>
                    <FormField label="Мест для парней">
                      <Input
                        defaultValue={editingEvent.maleCapacity}
                        name="maleCapacity"
                        type="number"
                      />
                    </FormField>
                  </div>
                  <div className={styles.twoColumns}>
                    <FormField label="Свободно всего">
                      <Input
                        defaultValue={editingEvent.spotsAvailable}
                        name="spotsAvailable"
                        type="number"
                      />
                    </FormField>
                    <FormField label="Свободно девушкам">
                      <Input
                        defaultValue={editingEvent.femaleSpotsAvailable}
                        name="femaleSpotsAvailable"
                        type="number"
                      />
                    </FormField>
                  </div>
                  <div className={styles.twoColumns}>
                    <FormField label="Свободно парням">
                      <Input
                        defaultValue={editingEvent.maleSpotsAvailable}
                        name="maleSpotsAvailable"
                        type="number"
                      />
                    </FormField>
                    <FormField label="Цена, PLN">
                      <Input
                        defaultValue={Math.round(editingEvent.priceGroszy / 100)}
                        name="price"
                        type="number"
                      />
                    </FormField>
                  </div>
                  <div className={styles.twoColumns}>
                    <FormField label="Язык">
                      <Input defaultValue={editingEvent.language} name="language" />
                    </FormField>
                    <Select
                      label="Статус"
                      name="status"
                      options={[
                        { label: "Черновик", value: "draft" },
                        { label: "Опубликовано", value: "published" },
                        { label: "Sold out", value: "sold_out" },
                        { label: "Завершено", value: "finished" },
                        { label: "Отменено", value: "cancelled" },
                      ]}
                      value={editStatus}
                      onChange={(value) => {
                        setEditStatus(value);
                        setEditPublicationMode(value === "published" ? "now" : "draft");
                      }}
                    />
                  </div>
                  <div className={styles.twoColumns}>
                    <FormField label="Длительность, мин">
                      <Input
                        defaultValue={editingEvent.durationMinutes}
                        name="durationMinutes"
                        type="number"
                      />
                    </FormField>
                    <FormField label="Раунд, мин">
                      <Input
                        defaultValue={editingEvent.conversationMinutes}
                        name="conversationMinutes"
                        type="number"
                      />
                    </FormField>
                  </div>
                  <Select
                    label="Администратор"
                    name="adminUserId"
                    options={admins.map((owner) => ({
                      label: `${getOwnerLabel(owner)} · ${owner.email}`,
                      value: owner.id,
                    }))}
                    value={editAdminUserId}
                    onChange={setEditAdminUserId}
                  />

                  {editStatus === "draft" ? (
                    <>
                      <Select
                        label="Публикация черновика"
                        name="publicationMode"
                        options={[
                          { label: "Оставить черновиком", value: "draft" },
                          { label: "Запланировать", value: "scheduled" },
                        ]}
                        value={editPublicationMode}
                        onChange={setEditPublicationMode}
                      />
                      {editPublicationMode === "scheduled" ? (
                        <div className={styles.twoColumns}>
                          <DatePickerField
                            label="Дата публикации"
                            maxYear={adminDatePickerMaxYear}
                            minYear={adminDatePickerMinYear}
                            name="publishDate"
                            value={editPublishDate}
                            onChange={setEditPublishDate}
                          />
                          <TimePickerField
                            label="Время публикации"
                            name="publishTime"
                            value={editPublishTime}
                            onChange={setEditPublishTime}
                          />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button variant="outline" onClick={() => setEditingEvent(null)}>
                Отмена
              </Button>
              <Button className={styles.primaryButton} type="submit">
                Сохранить изменения
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deletingEvent)}
        size="sm"
        title="Удалить мероприятие"
        onOpenChange={(open) => {
          if (!open) {
            setDeletingEvent(null);
          }
        }}
      >
        {deletingEvent ? (
          <form
            className={styles.modalForm}
            action={deleteEventAction}
            onSubmit={() => setDeletingEvent(null)}
          >
            <input name="eventId" type="hidden" value={deletingEvent.id} />
            <div className={styles.modalBody}>
              <div className={styles.compactStack}>
                <strong>{deletingEvent.title}</strong>
                <span>
                  Мероприятие будет удалено вместе со связанными записями и платежными черновиками.
                  Это действие нельзя отменить.
                </span>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button variant="outline" onClick={() => setDeletingEvent(null)}>
                Отмена
              </Button>
              <Button className={styles.deleteButton} type="submit">
                Удалить
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
