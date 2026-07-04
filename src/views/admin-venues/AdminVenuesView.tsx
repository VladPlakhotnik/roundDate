"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Edit3, MapPinned, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { AdminCard } from "@/admin/components/AdminCard";
import { AdminBadge } from "@/admin/components/AdminBadge";
import { AdminColumnVisibility } from "@/admin/components/AdminColumnVisibility";
import { AdminTable } from "@/admin/components/AdminTable";
import { getDefaultVisibleAdminColumnIds } from "@/admin/lib/default-visible-columns";
import type {
  AdminVenueFilters,
  AdminVenueListItem,
  AdminVenuesPageData,
} from "@/admin/server/venues";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import {
  AdminVenueMapPicker,
  type AdminVenueMapValue,
} from "@/views/admin-events/AdminVenueMapPicker";

import styles from "./AdminVenuesView.module.css";

type AdminVenuesViewProps = {
  createVenueAction: (formData: FormData) => Promise<void>;
  data: AdminVenuesPageData;
  deleteVenueAction: (formData: FormData) => Promise<void>;
  filters: AdminVenueFilters;
  updateVenueAction: (formData: FormData) => Promise<void>;
};

type VenueFormState = {
  address: string;
  capacity: number;
  city: string;
  district: string;
  id: string;
  latitude: number;
  longitude: number;
  mapUrl: string;
  name: string;
};

const venueTableColumns = [
  { id: "venue", label: "Площадка" },
  { id: "district", label: "Район" },
  { id: "coordinates", label: "Координаты" },
  { id: "capacity", label: "Вместимость" },
  { id: "events", label: "События" },
  { id: "updated", label: "Обновлен" },
  { id: "actions", label: "Action" },
] as const;

type VenueTableColumnId = (typeof venueTableColumns)[number]["id"];
const defaultVenueTableColumnIds = getDefaultVisibleAdminColumnIds(venueTableColumns, [
  "coordinates",
  "updated",
]);
const venueTableColumnStorageKey = "admin.venues.table.columns";

const defaultFormState: VenueFormState = {
  address: "ul. Chlebnicka 10/11, Gdansk",
  capacity: 16,
  city: "Gdansk",
  district: "Stare Miasto",
  id: "",
  latitude: 54.3464,
  longitude: 18.6533,
  mapUrl: "",
  name: "Новая площадка",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getFormStateFromVenue(venue: AdminVenueListItem): VenueFormState {
  return {
    address: venue.address,
    capacity: venue.capacity,
    city: venue.city,
    district: venue.district,
    id: venue.id,
    latitude: venue.latitude ?? defaultFormState.latitude,
    longitude: venue.longitude ?? defaultFormState.longitude,
    mapUrl: venue.mapUrl ?? "",
    name: venue.name,
  };
}

export function AdminVenuesView({
  createVenueAction,
  data,
  deleteVenueAction,
  filters,
  updateVenueAction,
}: AdminVenuesViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hasMountedRef = useRef(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState(filters.q);
  const debouncedQuery = useDebounce(query, 320);
  const [formState, setFormState] = useState<VenueFormState>(defaultFormState);
  const [visibleVenueColumnIds, setVisibleVenueColumnIds] = useState<string[]>(() => [
    ...defaultVenueTableColumnIds,
  ]);
  const isEditing = Boolean(formState.id);
  const visibleVenueColumnSet = new Set(visibleVenueColumnIds);
  const usedVenues = useMemo(
    () => data.venues.filter((venue) => venue.eventsCount > 0).length,
    [data.venues],
  );

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

    const nextUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [debouncedQuery, pathname, router]);

  function openCreateModal() {
    setFormState(defaultFormState);
    setIsModalOpen(true);
  }

  function openEditModal(venue: AdminVenueListItem) {
    setFormState(getFormStateFromVenue(venue));
    setIsModalOpen(true);
  }

  function updateFormField(key: keyof VenueFormState, value: string | number) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function handleMapChange(value: AdminVenueMapValue) {
    setFormState((current) => ({
      ...current,
      latitude: value.latitude,
      longitude: value.longitude,
    }));
  }

  function isVenueColumnVisible(columnId: VenueTableColumnId) {
    return visibleVenueColumnSet.has(columnId);
  }

  return (
    <div className={styles.page}>
      <AdminCard className={styles.headerCard}>
        <AdminCard.Content className={styles.header}>
          <div>
            <AdminBadge size="sm" tone="neutral">
              Admin workspace
            </AdminBadge>
            <h1>Адреса</h1>
            <p>
              Общая база площадок для мероприятий. Отсюда адреса привязываются к событиям и
              отображаются на карте.
            </p>
          </div>
          <Button
            className={styles.primaryButton}
            leftIcon={<Plus aria-hidden size={18} strokeWidth={2.2} />}
            size="lg"
            onClick={openCreateModal}
          >
            Добавить адрес
          </Button>
        </AdminCard.Content>
      </AdminCard>

      <section className={styles.summaryGrid} aria-label="Сводка по адресам">
        <AdminCard className={styles.panel}>
          <AdminCard.Content className={styles.summaryCard}>
            <span>
              <MapPinned aria-hidden size={20} strokeWidth={2.2} />
            </span>
            <div>
              <small>Всего адресов</small>
              <strong>{data.total}</strong>
            </div>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard className={styles.panel}>
          <AdminCard.Content className={styles.summaryCard}>
            <span data-tone="blue">
              <MapPinned aria-hidden size={20} strokeWidth={2.2} />
            </span>
            <div>
              <small>Используются</small>
              <strong>{usedVenues}</strong>
            </div>
          </AdminCard.Content>
        </AdminCard>
      </section>

      <AdminCard className={styles.panel}>
        <AdminCard.Content>
          <div className={styles.filters}>
            <Input
              className={styles.searchField}
              label="Поиск"
              leftIcon={<Search aria-hidden size={17} strokeWidth={2.2} />}
              minLength={2}
              name="q"
              placeholder="Название, улица, город или район"
              size="sm"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            <AdminColumnVisibility
              columns={venueTableColumns}
              storageKey={venueTableColumnStorageKey}
              visibleColumnIds={visibleVenueColumnIds}
              onVisibleColumnIdsChange={setVisibleVenueColumnIds}
            />
            {filters.q ? (
              <Link
                className={styles.resetLink}
                href="/admin/addresses"
                onClick={() => setQuery("")}
              >
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
              <AdminTable aria-label="Список адресов">
                <AdminTable.Header>
                  <AdminTable.Row>
                    {isVenueColumnVisible("venue") ? (
                      <AdminTable.Column isRowHeader>Площадка</AdminTable.Column>
                    ) : null}
                    {isVenueColumnVisible("district") ? (
                      <AdminTable.Column>Район</AdminTable.Column>
                    ) : null}
                    {isVenueColumnVisible("coordinates") ? (
                      <AdminTable.Column>Координаты</AdminTable.Column>
                    ) : null}
                    {isVenueColumnVisible("capacity") ? (
                      <AdminTable.Column>Вместимость</AdminTable.Column>
                    ) : null}
                    {isVenueColumnVisible("events") ? (
                      <AdminTable.Column>События</AdminTable.Column>
                    ) : null}
                    {isVenueColumnVisible("updated") ? (
                      <AdminTable.Column>Обновлен</AdminTable.Column>
                    ) : null}
                    {isVenueColumnVisible("actions") ? (
                      <AdminTable.Column>Action</AdminTable.Column>
                    ) : null}
                  </AdminTable.Row>
                </AdminTable.Header>
                <AdminTable.Body>
                  {data.venues.map((venue) => (
                    <AdminTable.Row id={venue.id} key={venue.id}>
                      {isVenueColumnVisible("venue") ? (
                        <AdminTable.Cell>
                          <div className={styles.venueCell}>
                            <span>
                              <MapPinned aria-hidden size={18} />
                            </span>
                            <div>
                              <strong>{venue.name}</strong>
                              <small>{venue.address}</small>
                              <small>{venue.city}</small>
                            </div>
                          </div>
                        </AdminTable.Cell>
                      ) : null}
                      {isVenueColumnVisible("district") ? (
                        <AdminTable.Cell>{venue.district}</AdminTable.Cell>
                      ) : null}
                      {isVenueColumnVisible("coordinates") ? (
                        <AdminTable.Cell>
                          <span className={styles.coords}>
                            {venue.latitude != null && venue.longitude != null
                              ? `${venue.latitude.toFixed(4)}, ${venue.longitude.toFixed(4)}`
                              : "Не указаны"}
                          </span>
                        </AdminTable.Cell>
                      ) : null}
                      {isVenueColumnVisible("capacity") ? (
                        <AdminTable.Cell>{venue.capacity}</AdminTable.Cell>
                      ) : null}
                      {isVenueColumnVisible("events") ? (
                        <AdminTable.Cell>{venue.eventsCount}</AdminTable.Cell>
                      ) : null}
                      {isVenueColumnVisible("updated") ? (
                        <AdminTable.Cell>{formatDate(venue.updatedAt)}</AdminTable.Cell>
                      ) : null}
                      {isVenueColumnVisible("actions") ? (
                        <AdminTable.Cell>
                          <div className={styles.actions}>
                            <Button
                              aria-label="Редактировать адрес"
                              size="icon"
                              variant="outline"
                              onClick={() => openEditModal(venue)}
                            >
                              <Edit3 aria-hidden size={16} strokeWidth={2.2} />
                            </Button>
                            <form action={deleteVenueAction}>
                              <input name="venueId" type="hidden" value={venue.id} />
                              <Button
                                aria-label="Удалить адрес"
                                size="icon"
                                type="submit"
                                variant="soft"
                              >
                                <Trash2 aria-hidden size={16} strokeWidth={2.2} />
                              </Button>
                            </form>
                          </div>
                        </AdminTable.Cell>
                      ) : null}
                    </AdminTable.Row>
                  ))}
                </AdminTable.Body>
              </AdminTable>
            </AdminTable.ScrollContainer>
          </div>
        </AdminCard.Content>
      </AdminCard>

      <Modal
        contentClassName={styles.modalDialog}
        open={isModalOpen}
        size="lg"
        title={isEditing ? "Редактирование адреса" : "Новый адрес"}
        onOpenChange={setIsModalOpen}
      >
        <form
          className={styles.modalForm}
          action={isEditing ? updateVenueAction : createVenueAction}
        >
          <input name="venueId" type="hidden" value={formState.id} />
          <input name="latitude" type="hidden" value={formState.latitude} />
          <input name="longitude" type="hidden" value={formState.longitude} />

          <div className={styles.modalBody}>
            <AdminVenueMapPicker
              value={{ latitude: formState.latitude, longitude: formState.longitude }}
              onChange={handleMapChange}
            />
            <div className={styles.formGrid}>
              <Input
                required
                label="Название площадки"
                name="name"
                value={formState.name}
                onChange={(event) => updateFormField("name", event.currentTarget.value)}
              />
              <Input
                required
                label="Адрес"
                name="address"
                value={formState.address}
                onChange={(event) => updateFormField("address", event.currentTarget.value)}
              />
              <div className={styles.twoColumns}>
                <Input
                  label="Город"
                  name="city"
                  value={formState.city}
                  onChange={(event) => updateFormField("city", event.currentTarget.value)}
                />
                <Input
                  label="Район"
                  name="district"
                  value={formState.district}
                  onChange={(event) => updateFormField("district", event.currentTarget.value)}
                />
              </div>
              <div className={styles.twoColumns}>
                <Input
                  label="Вместимость"
                  name="capacity"
                  type="number"
                  value={String(formState.capacity)}
                  onChange={(event) =>
                    updateFormField("capacity", Number(event.currentTarget.value))
                  }
                />
                <Input
                  label="Ссылка на карту"
                  name="mapUrl"
                  placeholder="https://maps.google.com/..."
                  value={formState.mapUrl}
                  onChange={(event) => updateFormField("mapUrl", event.currentTarget.value)}
                />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button className={styles.primaryButton} type="submit">
              {isEditing ? "Сохранить" : "Добавить адрес"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
