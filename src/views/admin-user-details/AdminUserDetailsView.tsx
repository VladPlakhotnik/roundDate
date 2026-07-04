import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  HeartHandshake,
  MapPinned,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { AdminCard } from "@/admin/components/AdminCard";
import { AdminBadge, type AdminBadgeTone } from "@/admin/components/AdminBadge";
import { AdminTable } from "@/admin/components/AdminTable";
import type {
  AdminUserDetailsBooking,
  AdminUserDetailsPageData,
  AdminUserDetailsPayment,
  AdminUserPaymentStatus,
} from "@/admin/server/users";
import { Button } from "@/shared/ui/Button";

import styles from "./AdminUserDetailsView.module.css";

type AdminUserDetailsViewProps = {
  data: AdminUserDetailsPageData;
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Warsaw",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "Europe/Warsaw",
  year: "numeric",
});

const bookingStatusLabels: Record<AdminUserDetailsBooking["status"], string> = {
  attended: "Пришел",
  cancelled: "Отменена",
  confirmed: "Подтверждена",
  no_show: "Не пришел",
  payment_failed: "Оплата не прошла",
  pending: "Новая",
  pending_payment: "Ожидает оплату",
  refunded: "Возврат",
  waitlisted: "Лист ожидания",
};

const bookingStatusTones: Record<AdminUserDetailsBooking["status"], AdminBadgeTone> = {
  attended: "success",
  cancelled: "neutral",
  confirmed: "success",
  no_show: "warning",
  payment_failed: "danger",
  pending: "neutral",
  pending_payment: "warning",
  refunded: "info",
  waitlisted: "info",
};

const eventStatusLabels: Record<AdminUserDetailsBooking["eventStatus"], string> = {
  cancelled: "Отменено",
  draft: "Черновик",
  finished: "Завершено",
  published: "Опубликовано",
  sold_out: "Sold out",
};

const paymentStatusLabels: Record<AdminUserPaymentStatus, string> = {
  failed: "Ошибка",
  paid: "Оплачен",
  pending: "Ожидает",
  refunded: "Возврат",
};

const paymentStatusTones: Record<AdminUserPaymentStatus, AdminBadgeTone> = {
  failed: "danger",
  paid: "success",
  pending: "warning",
  refunded: "info",
};

function formatDate(date: Date | null) {
  return date ? dateFormatter.format(date) : "Не указано";
}

function formatDateTime(date: Date | null) {
  return date ? dateTimeFormatter.format(date) : "Не указано";
}

function formatBirthDate(value: string | null) {
  if (!value) {
    return "Не указано";
  }

  return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

function formatMoney(amountGroszy: number, currency = "PLN") {
  return new Intl.NumberFormat("ru-RU", {
    currency,
    style: "currency",
  }).format(amountGroszy / 100);
}

function formatBoolean(value: boolean | null) {
  if (value === null) {
    return "Не указано";
  }

  return value ? "Да" : "Нет";
}

function formatList(values: string[] | null) {
  return values && values.length > 0 ? values.join(", ") : "Не указано";
}

function formatText(value: string | null) {
  return value?.trim() ? value : "Не указано";
}

function getDisplayName(data: AdminUserDetailsPageData) {
  const { user } = data;

  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || user.email;
}

function getInitials(data: AdminUserDetailsPageData) {
  const [first = "", second = ""] = getDisplayName(data).split(" ");

  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase() || "U";
}

function getOnboardingStatus(data: AdminUserDetailsPageData) {
  const { user } = data;

  if (user.onboardingCompletedAt) {
    return `Завершен ${formatDate(user.onboardingCompletedAt)}`;
  }

  if (user.onboardingSkippedAt) {
    return `Пропущен ${formatDate(user.onboardingSkippedAt)}`;
  }

  if (user.onboardingStartedAt) {
    return `Начат ${formatDate(user.onboardingStartedAt)}`;
  }

  return "Не начат";
}

function getVenueLabel(booking: AdminUserDetailsBooking) {
  return [booking.venueName, booking.venueAddress, booking.city].filter(Boolean).join(" · ");
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function EmptyState({ children }: { children: string }) {
  return <div className={styles.emptyState}>{children}</div>;
}

function BookingsTable({ bookings }: { bookings: AdminUserDetailsBooking[] }) {
  if (bookings.length === 0) {
    return <EmptyState>У пользователя пока нет записей на мероприятия.</EmptyState>;
  }

  return (
    <AdminTable.ScrollContainer>
      <AdminTable aria-label="История мероприятий пользователя">
        <AdminTable.Header>
          <AdminTable.Row>
            <AdminTable.Column isRowHeader>Мероприятие</AdminTable.Column>
            <AdminTable.Column>Статус</AdminTable.Column>
            <AdminTable.Column>Номер</AdminTable.Column>
            <AdminTable.Column>Дата</AdminTable.Column>
            <AdminTable.Column>Площадка</AdminTable.Column>
          </AdminTable.Row>
        </AdminTable.Header>
        <AdminTable.Body>
          {bookings.map((booking) => (
            <AdminTable.Row id={booking.bookingId} key={booking.bookingId}>
              <AdminTable.Cell>
                <div className={styles.tableTitleCell}>
                  <strong>{booking.eventTitle}</strong>
                  <span>{eventStatusLabels[booking.eventStatus]}</span>
                </div>
              </AdminTable.Cell>
              <AdminTable.Cell>
                <AdminBadge size="sm" tone={bookingStatusTones[booking.status]}>
                  {bookingStatusLabels[booking.status]}
                </AdminBadge>
              </AdminTable.Cell>
              <AdminTable.Cell>
                <span className={styles.monoValue}>
                  {booking.attendeeNumber ? `#${booking.attendeeNumber}` : "Не выдан"}
                </span>
              </AdminTable.Cell>
              <AdminTable.Cell>
                <time dateTime={booking.startsAt.toISOString()}>
                  {formatDateTime(booking.startsAt)}
                </time>
              </AdminTable.Cell>
              <AdminTable.Cell>{getVenueLabel(booking) || "Не указано"}</AdminTable.Cell>
            </AdminTable.Row>
          ))}
        </AdminTable.Body>
      </AdminTable>
    </AdminTable.ScrollContainer>
  );
}

function PaymentsTable({ payments }: { payments: AdminUserDetailsPayment[] }) {
  if (payments.length === 0) {
    return <EmptyState>Платежи по этому пользователю пока не найдены.</EmptyState>;
  }

  return (
    <AdminTable.ScrollContainer>
      <AdminTable aria-label="Платежи пользователя">
        <AdminTable.Header>
          <AdminTable.Row>
            <AdminTable.Column isRowHeader>Мероприятие</AdminTable.Column>
            <AdminTable.Column>Статус</AdminTable.Column>
            <AdminTable.Column>Сумма</AdminTable.Column>
            <AdminTable.Column>Провайдер</AdminTable.Column>
            <AdminTable.Column>Дата</AdminTable.Column>
            <AdminTable.Column>ID платежа</AdminTable.Column>
          </AdminTable.Row>
        </AdminTable.Header>
        <AdminTable.Body>
          {payments.map((payment) => (
            <AdminTable.Row id={payment.id} key={payment.id}>
              <AdminTable.Cell>
                <strong>{payment.eventTitle}</strong>
              </AdminTable.Cell>
              <AdminTable.Cell>
                <AdminBadge size="sm" tone={paymentStatusTones[payment.status]}>
                  {paymentStatusLabels[payment.status]}
                </AdminBadge>
              </AdminTable.Cell>
              <AdminTable.Cell>
                {formatMoney(payment.amountGroszy, payment.currency)}
              </AdminTable.Cell>
              <AdminTable.Cell>{payment.provider}</AdminTable.Cell>
              <AdminTable.Cell>
                <time dateTime={payment.createdAt.toISOString()}>
                  {formatDateTime(payment.createdAt)}
                </time>
              </AdminTable.Cell>
              <AdminTable.Cell>
                <span className={styles.monoValue}>{payment.providerPaymentId ?? payment.id}</span>
              </AdminTable.Cell>
            </AdminTable.Row>
          ))}
        </AdminTable.Body>
      </AdminTable>
    </AdminTable.ScrollContainer>
  );
}

export function AdminUserDetailsView({ data }: AdminUserDetailsViewProps) {
  const { stats, user } = data;
  const displayName = getDisplayName(data);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Button
          as="link"
          href="/admin/users"
          leftIcon={<ArrowLeft aria-hidden size={16} strokeWidth={2.4} />}
          size="sm"
          variant="outline"
        >
          Назад к пользователям
        </Button>
      </div>

      <AdminCard className={styles.heroCard}>
        <AdminCard.Content className={styles.hero}>
          <div className={styles.identity}>
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={user.image} />
            ) : (
              <span>{getInitials(data)}</span>
            )}
            <div>
              <div className={styles.badgeRow}>
                <AdminBadge size="sm" tone={user.role === "admin" ? "info" : "neutral"}>
                  {user.role === "admin" ? "Админ" : "Пользователь"}
                </AdminBadge>
                <AdminBadge size="sm" tone={user.banned ? "danger" : "success"}>
                  {user.banned ? "Заблокирован" : "Активен"}
                </AdminBadge>
              </div>
              <h1>{displayName}</h1>
              <p>{user.email}</p>
            </div>
          </div>
          <dl className={styles.heroMeta}>
            <DetailRow label="Телефон" value={formatText(user.phone)} />
            <DetailRow label="Создан" value={formatDate(user.createdAt)} />
            <DetailRow label="Обновлен" value={formatDate(user.updatedAt)} />
          </dl>
        </AdminCard.Content>
      </AdminCard>

      <section className={styles.summaryGrid} aria-label="Сводка пользователя">
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span>
              <CalendarDays aria-hidden size={20} strokeWidth={2.2} />
            </span>
            <div>
              <small>Мероприятия</small>
              <strong>{stats.bookingsTotal}</strong>
              <p>{stats.upcomingCount} будущих</p>
            </div>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span data-tone="success">
              <CheckCircle2 aria-hidden size={20} strokeWidth={2.2} />
            </span>
            <div>
              <small>Посещение</small>
              <strong>{stats.attendedCount}</strong>
              <p>
                {stats.noShowCount} не пришел, {stats.cancelledCount} отменено
              </p>
            </div>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span data-tone="payment">
              <CreditCard aria-hidden size={20} strokeWidth={2.2} />
            </span>
            <div>
              <small>Оплачено</small>
              <strong>{formatMoney(stats.paidAmountGroszy)}</strong>
              <p>
                {stats.paidPayments} успешно, {stats.failedPayments} ошибок
              </p>
            </div>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span data-tone="match">
              <HeartHandshake aria-hidden size={20} strokeWidth={2.2} />
            </span>
            <div>
              <small>Мэтчи</small>
              <strong>{stats.mutualMatchesCount}</strong>
              <p>
                {stats.likesGivenCount} лайков, {stats.likesReceivedCount} получено
              </p>
            </div>
          </AdminCard.Content>
        </AdminCard>
      </section>

      <section className={styles.detailsGrid}>
        <AdminCard>
          <AdminCard.Header>
            <AdminCard.Title>
              <UserRound aria-hidden size={18} strokeWidth={2.2} />
              Профиль
            </AdminCard.Title>
          </AdminCard.Header>
          <AdminCard.Content>
            <dl className={styles.detailList}>
              <DetailRow label="Имя" value={formatText(user.firstName)} />
              <DetailRow label="Фамилия" value={formatText(user.lastName)} />
              <DetailRow label="Дата рождения" value={formatBirthDate(user.birthDate)} />
              <DetailRow label="Пол" value={formatText(user.gender)} />
              <DetailRow label="Интересуется" value={formatText(user.interestedIn)} />
              <DetailRow label="Источник" value={formatText(user.discoverySource)} />
              <DetailRow label="Язык" value={formatText(user.locale)} />
              <DetailRow label="Дни" value={formatList(user.preferredDays)} />
              <DetailRow label="Время" value={formatList(user.preferredTimes)} />
            </dl>
          </AdminCard.Content>
        </AdminCard>

        <AdminCard>
          <AdminCard.Header>
            <AdminCard.Title>
              <ShieldCheck aria-hidden size={18} strokeWidth={2.2} />
              Аккаунт
            </AdminCard.Title>
          </AdminCard.Header>
          <AdminCard.Content>
            <dl className={styles.detailList}>
              <DetailRow label="Email подтвержден" value={formatBoolean(user.emailVerified)} />
              <DetailRow label="Онбординг" value={getOnboardingStatus(data)} />
              <DetailRow label="Маркетинг" value={formatBoolean(user.marketingConsent)} />
              <DetailRow label="Email-уведомления" value={formatBoolean(user.emailNotifications)} />
              <DetailRow
                label="Напоминания"
                value={formatBoolean(user.eventReminderNotifications)}
              />
              <DetailRow label="Результаты" value={formatBoolean(user.eventResultNotifications)} />
              <DetailRow label="Новые даты" value={formatBoolean(user.newDateNotifications)} />
              <DetailRow
                label="Подбор событий"
                value={formatBoolean(user.eventCriteriaNotifications)}
              />
              <DetailRow label="Причина блока" value={formatText(user.banReason)} />
              <DetailRow label="Блок до" value={formatDateTime(user.banExpires)} />
            </dl>
          </AdminCard.Content>
        </AdminCard>
      </section>

      <AdminCard>
        <AdminCard.Header>
          <AdminCard.Title>
            <MapPinned aria-hidden size={18} strokeWidth={2.2} />
            Мероприятия
          </AdminCard.Title>
          <AdminCard.Description>
            Все записи пользователя и выданные номера бейджей.
          </AdminCard.Description>
        </AdminCard.Header>
        <AdminCard.Content>
          <BookingsTable bookings={data.bookings} />
        </AdminCard.Content>
      </AdminCard>

      <AdminCard>
        <AdminCard.Header>
          <AdminCard.Title>
            <CreditCard aria-hidden size={18} strokeWidth={2.2} />
            Платежи
          </AdminCard.Title>
          <AdminCard.Description>Платежная история по записям пользователя.</AdminCard.Description>
        </AdminCard.Header>
        <AdminCard.Content>
          <PaymentsTable payments={data.payments} />
        </AdminCard.Content>
      </AdminCard>
    </div>
  );
}
