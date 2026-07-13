"use client";

import {
  CalendarDays,
  Clock3,
  Coffee,
  CreditCard,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useRef, useState, type FormEvent, type ReactNode } from "react";

import { useI18n } from "@/shared/i18n/I18nProvider";
import {
  EMAIL_VALIDATION_MESSAGE,
  POLISH_PHONE_VALIDATION_MESSAGE,
  emailSchema,
  polishPhoneSchema,
} from "@/shared/lib/validation/contact";
import { Badge, type BadgeStatus } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { Select } from "@/shared/ui/Select";
import { useToast } from "@/shared/ui/Toast";

import { EventDetailsMap } from "./EventDetailsMap";
import type { EventMapLocation } from "./EventDetailsMap";
import {
  DEFAULT_EVENT_ORGANIZER,
  getOrganizerName,
  OrganizerModal,
  type EventOrganizer,
} from "./OrganizerModal";
import styles from "./EventDetailsModal.module.css";
import { EventGenderAvailability } from "./EventGenderAvailability";

export type EventDetailsModalContext = "available" | "booking" | "past";

export type EventDetailsModalEvent = {
  ageRange: string;
  capacityTotal: number;
  city: string;
  conversationMinutes: number;
  dateLabel: string;
  description: string;
  durationMinutes: number;
  highlights: string[];
  id: string;
  language: string;
  locationLabel: string;
  mapLocation: EventMapLocation;
  organizer?: EventOrganizer;
  priceLabel: string;
  femaleSpotsAvailable?: number;
  maleSpotsAvailable?: number;
  spotsAvailable: number;
  startsAt: string;
  statusLabel: string;
  timeLabel: string;
  title: string;
  venueAddress: string;
  venueName: string;
  weekdayLabel: string;
};

export type BookingParticipantDefaults = {
  email?: string;
  firstName?: string;
  gender?: string;
  lastName?: string;
  phone?: string;
};

type BookingParticipant = {
  email: string;
  firstName: string;
  gender: string;
  lastName: string;
  phone: string;
};

type BookingStatus = "error" | "idle" | "loading" | "success";
type BookingParticipantErrors = Partial<Record<"email" | "phone", string>>;

type EventDetailsModalProps = {
  bookingDefaults?: BookingParticipantDefaults;
  context?: EventDetailsModalContext;
  event: EventDetailsModalEvent;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  status?: BadgeStatus;
  trigger?: ReactNode;
};

function formatEventDate(event: EventDetailsModalEvent, locale: string) {
  const startsAt = new Date(event.startsAt);
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Warsaw",
    year: "numeric",
  }).format(startsAt);

  return `${date}, ${event.weekdayLabel.toLowerCase()}`;
}

function formatTime(startsAt: Date, locale: string, offsetMinutes = 0) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(new Date(startsAt.getTime() + offsetMinutes * 60_000));
}

function getSchedule(event: EventDetailsModalEvent, locale: string, t: (key: string) => string) {
  const startsAt = new Date(event.startsAt);
  const finalOffset = Math.max(event.durationMinutes, 110);

  return [
    { label: t("event.schedule.arrival"), time: formatTime(startsAt, locale, -30) },
    { label: t("event.schedule.conversations"), time: formatTime(startsAt, locale) },
    {
      label: t("event.schedule.break"),
      time: formatTime(startsAt, locale, Math.round(finalOffset * 0.55)),
    },
    {
      label: t("event.schedule.continuation"),
      time: formatTime(startsAt, locale, Math.round(finalOffset * 0.72)),
    },
    { label: t("event.schedule.finale"), time: formatTime(startsAt, locale, finalOffset) },
  ];
}

function isEventEnded(event: EventDetailsModalEvent) {
  const startsAt = new Date(event.startsAt);
  const normalizedStatus = event.statusLabel.toLowerCase();

  return (
    (!Number.isNaN(startsAt.getTime()) && startsAt.getTime() <= Date.now()) ||
    normalizedStatus.includes("zakończ") ||
    normalizedStatus.includes("finished")
  );
}

function getPrimaryAction(
  context: EventDetailsModalContext,
  event: EventDetailsModalEvent,
  status: BadgeStatus | undefined,
  t: (key: string) => string,
) {
  if (
    context === "past" ||
    Number.isNaN(new Date(event.startsAt).getTime()) ||
    isEventEnded(event)
  ) {
    return null;
  }

  if (context === "available") {
    if (event.spotsAvailable <= 0) {
      return null;
    }

    return {
      icon: CreditCard,
      label: t("event.status.pay"),
      variant: "primary" as const,
    };
  }

  if (status === "payment-failed") {
    return {
      icon: CreditCard,
      label: t("event.status.retryPayment"),
      variant: "primary" as const,
    };
  }

  if (status === "payment-pending") {
    return {
      icon: CreditCard,
      label: t("event.status.pay"),
      variant: "primary" as const,
    };
  }

  return null;
}

function getSummaryBadge(event: EventDetailsModalEvent, t: (key: string) => string) {
  const normalizedStatus = event.statusLabel.toLowerCase();

  if (isEventEnded(event)) {
    return { label: event.statusLabel, tone: "neutral" as const };
  }

  if (
    event.spotsAvailable <= 0 ||
    normalizedStatus.includes(t("event.availability.none").toLowerCase()) ||
    normalizedStatus.includes("brak") ||
    normalizedStatus.includes("sold")
  ) {
    return { label: t("event.availability.none"), tone: "neutral" as const };
  }

  return { label: t("event.availability.seatsAvailable"), tone: "success" as const };
}

function createBookingParticipant(defaults?: BookingParticipantDefaults): BookingParticipant {
  return {
    email: defaults?.email ?? "",
    firstName: defaults?.firstName ?? "",
    gender: defaults?.gender ?? "",
    lastName: defaults?.lastName ?? "",
    phone: defaults?.phone ?? "",
  };
}

function isBookingParticipantComplete(participant: BookingParticipant) {
  return Boolean(
    participant.email.trim() &&
    participant.firstName.trim() &&
    participant.gender.trim() &&
    participant.lastName.trim() &&
    participant.phone.trim(),
  );
}

function getBookingTimeRange(event: EventDetailsModalEvent, locale: string) {
  return `${event.timeLabel} - ${formatTime(new Date(event.startsAt), locale, event.durationMinutes)}`;
}

function getFormatHighlights(
  event: EventDetailsModalEvent,
  t: (key: string, values?: Record<string, number | string>) => string,
) {
  const defaultHighlights = [
    t("event.participation.age", { ageRange: event.ageRange }),
    event.language,
    t("event.participation.conversation", { minutes: event.conversationMinutes }),
    t("event.participation.capacity", { capacityTotal: event.capacityTotal }),
  ];

  if (event.highlights.length === 0) {
    return defaultHighlights;
  }

  return [
    ...event.highlights,
    ...defaultHighlights.filter((highlight) => !event.highlights.includes(highlight)),
  ];
}

export function EventDetailsModal({
  bookingDefaults,
  context = "available",
  event,
  onOpenChange,
  open,
  status,
  trigger,
}: EventDetailsModalProps) {
  const { locale, t } = useI18n();
  const toast = useToast();
  const dateLocale = locale === "en" ? "en-US" : "pl-PL";
  const genderOptions = [
    { label: t("common.gender.female"), value: "female" },
    { label: t("common.gender.male"), value: "male" },
    { label: t("common.gender.other"), value: "other" },
  ];
  const schedule = getSchedule(event, dateLocale, t);
  const eventEnded = isEventEnded(event);
  const primaryAction = getPrimaryAction(context, event, status, t);
  const PrimaryIcon = primaryAction?.icon;
  const summaryBadge = getSummaryBadge(event, t);
  const organizer = event.organizer ?? DEFAULT_EVENT_ORGANIZER;
  const organizerName = getOrganizerName(organizer);
  const formatHighlights = getFormatHighlights(event, t);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2>(1);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("idle");
  const [bookingMessage, setBookingMessage] = useState("");
  const [participantErrors, setParticipantErrors] = useState<BookingParticipantErrors>({});
  const [participant, setParticipant] = useState<BookingParticipant>(() =>
    createBookingParticipant(bookingDefaults),
  );
  const [promoCode, setPromoCode] = useState("");
  const bookingRequestInFlight = useRef(false);
  const bookingProgress = bookingStep === 1 ? 50 : 100;
  const participantComplete = isBookingParticipantComplete(participant);
  const bookingSubmitLabel =
    bookingStep === 1
      ? t("event.booking.toPayment")
      : context === "booking" && status === "payment-failed"
        ? t("event.booking.retrySubmit")
        : context === "booking"
          ? t("event.status.pay")
          : t("event.booking.submit");

  function updateParticipant(field: keyof BookingParticipant, value: string) {
    setParticipant((currentParticipant) => ({ ...currentParticipant, [field]: value }));

    if (field === "email" || field === "phone") {
      setParticipantErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };

        delete nextErrors[field];

        return nextErrors;
      });
    }
  }

  function openBookingFlow(initialStep: 1 | 2 = 1) {
    setParticipant(createBookingParticipant(bookingDefaults));
    setParticipantErrors({});
    setPromoCode("");
    setBookingStep(initialStep);
    setBookingStatus("idle");
    setBookingMessage("");
    setBookingOpen(true);
  }

  function handleBookingOpenChange(nextOpen: boolean) {
    setBookingOpen(nextOpen);

    if (!nextOpen) {
      setParticipantErrors({});
      setBookingStatus("idle");
      setBookingMessage("");
    }
  }

  function validateParticipantContacts() {
    const parsedEmail = emailSchema.safeParse(participant.email);
    const parsedPhone = polishPhoneSchema.safeParse(participant.phone);
    const errors: BookingParticipantErrors = {};

    if (!parsedEmail.success) {
      errors.email = EMAIL_VALIDATION_MESSAGE;
    }

    if (!parsedPhone.success) {
      errors.phone = POLISH_PHONE_VALIDATION_MESSAGE;
    }

    setParticipantErrors(errors);

    if (!parsedEmail.success || !parsedPhone.success) {
      return false;
    }

    setParticipant((currentParticipant) => ({
      ...currentParticipant,
      email: parsedEmail.data,
      phone: parsedPhone.data,
    }));

    return true;
  }

  function handlePrimaryActionClick() {
    if (!primaryAction) {
      return;
    }

    if (context === "available") {
      openBookingFlow(1);
      return;
    }

    if (context === "booking" && (status === "payment-failed" || status === "payment-pending")) {
      openBookingFlow(2);
    }
  }

  async function createBooking() {
    if (bookingRequestInFlight.current) {
      return;
    }

    bookingRequestInFlight.current = true;
    setBookingStatus("loading");
    setBookingMessage("");

    try {
      const response = await fetch("/api/profile/bookings", {
        body: JSON.stringify({ eventId: event.id }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        booking?: { bookingStatus?: string; status?: string };
        checkout?: { url?: string };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? t("event.booking.createError"));
      }

      const waitlisted =
        payload.booking?.bookingStatus === "waitlisted" || payload.booking?.status === "waitlist";

      if (waitlisted) {
        setBookingStatus("success");
        setBookingMessage(t("event.booking.waitlist"));
        return;
      }

      if (payload.checkout?.url) {
        setBookingMessage(t("event.booking.redirecting"));
        window.location.assign(payload.checkout.url);
        return;
      }

      throw new Error(t("event.booking.checkoutMissing"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("event.booking.createError");

      setBookingStatus("error");
      setBookingMessage(message);
      toast.error(t("event.booking.paymentErrorTitle"), message);
    } finally {
      bookingRequestInFlight.current = false;
    }
  }

  function handleBookingSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    if (bookingStep === 1) {
      if (participantComplete && validateParticipantContacts()) {
        setBookingStep(2);
      }

      return;
    }

    if (bookingStatus !== "success") {
      void createBooking();
    }
  }

  return (
    <Modal
      className={styles.modalBody}
      contentClassName={styles.modalContent}
      {...(onOpenChange ? { onOpenChange } : {})}
      {...(open !== undefined ? { open } : {})}
      showCloseButton
      size="xl"
      title={t("event.detailsTitle", { title: event.title })}
      trigger={trigger}
      visuallyHiddenTitle
    >
      <div
        className={styles.shell}
        data-mobile-layout="compact-modal"
        data-testid="event-details-shell"
      >
        <EventDetailsMap location={event.mapLocation} />

        <div
          className={styles.bodyGrid}
          data-mobile-scroll="details"
          data-testid="event-details-body"
        >
          <div
            className={styles.mainColumn}
            data-mobile-priority="secondary"
            data-testid="event-details-main"
          >
            <section
              className={styles.overviewBlock}
              data-density="compact"
              data-testid="event-details-overview"
            >
              <div className={styles.overviewHeader}>
                <h2 data-testid="event-details-overview-title">{event.title}</h2>
              </div>

              <div
                className={styles.overviewMeta}
                data-layout="split"
                data-testid="event-details-overview-meta"
              >
                <div
                  className={styles.overviewSchedule}
                  data-testid="event-details-overview-schedule"
                >
                  <span>
                    <CalendarDays aria-hidden size={20} />
                    <strong>{formatEventDate(event, dateLocale)}</strong>
                  </span>
                  <span>
                    <Clock3 aria-hidden size={20} />
                    <strong>{getBookingTimeRange(event, dateLocale)}</strong>
                  </span>
                </div>

                <div className={styles.overviewVenue} data-testid="event-details-overview-venue">
                  <MapPin aria-hidden size={21} />
                  <span>
                    <strong>{event.venueName}</strong>
                    <em>{event.venueAddress}</em>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${event.venueName}, ${event.city}, ${event.venueAddress}`,
                      )}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {t("event.directions")}
                    </a>
                  </span>
                </div>
              </div>
            </section>

            <section className={styles.infoBlock}>
              <span className={styles.sectionIcon}>
                <Heart aria-hidden size={26} />
              </span>
              <div>
                <h2>{t("event.overview")}</h2>
                <p>{event.description}</p>
              </div>
            </section>

            <section className={styles.infoBlock}>
              <span className={styles.sectionIcon}>
                <UsersRound aria-hidden size={26} />
              </span>
              <div>
                <h2>{t("event.participation.heading")}</h2>
                <ul
                  className={styles.highlightList}
                  data-columns="2"
                  data-testid="event-details-format-list"
                >
                  {formatHighlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className={styles.programBlock}>
              <span className={styles.sectionIcon}>
                <Coffee aria-hidden size={26} />
              </span>
              <div>
                <h2>{t("event.schedule.heading")}</h2>
                <div
                  className={styles.timeline}
                  data-line-align="dot-center"
                  data-testid="event-details-timeline"
                >
                  {schedule.map((item) => (
                    <div className={styles.timelineItem} key={`${item.time}-${item.label}`}>
                      <span className={styles.timelineDot} />
                      <strong>{item.time}</strong>
                      <small>{item.label}</small>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside
            className={styles.summaryCard}
            aria-label={t("event.summaryAria")}
            data-mobile-priority="primary"
            data-testid="event-details-summary"
          >
            <div className={styles.summaryHeader}>
              <h2>{eventEnded ? t("event.summaryTitle") : t("event.booking.paymentStep")}</h2>
              <Sparkles aria-hidden size={28} />
            </div>

            <div
              className={styles.summaryStatus}
              data-testid="event-details-summary-status"
              data-tone={summaryBadge.tone}
            >
              <span aria-hidden className={styles.summaryStatusDot} />
              <strong>{summaryBadge.label}</strong>
            </div>

            {context === "booking" && status ? (
              <div className={styles.bookingStateCard} data-testid="event-details-booking-status">
                <span>{t("event.labels.bookingStatus")}</span>
                <Badge status={status} />
              </div>
            ) : null}

            {!eventEnded ? (
              <EventGenderAvailability
                className={styles.summaryAvailability}
                femaleSpotsAvailable={event.femaleSpotsAvailable}
                maleSpotsAvailable={event.maleSpotsAvailable}
                spotsAvailable={event.spotsAvailable}
              />
            ) : null}

            <div className={styles.priceBlock}>
              <CreditCard aria-hidden size={22} />
              <span>
                {t("event.labels.price")}
                <strong>{event.priceLabel}</strong>
              </span>
            </div>

            <div className={styles.organizerCard}>
              <div className={styles.organizerAvatar} aria-hidden>
                {organizer.firstName[0]}
              </div>
              <div>
                <small>{t("event.labels.organizer")}</small>
                <strong>{organizerName}</strong>
                <span>{organizer.role ?? t("event.organizer.defaultRole")}</span>
                <a href={`tel:${organizer.phone.replace(/[^\d+]/g, "")}`}>
                  <Phone aria-hidden size={15} />
                  {organizer.phone}
                </a>
              </div>
            </div>
          </aside>
        </div>

        <div
          className={styles.footerBar}
          data-mobile-sticky="actions"
          data-testid="event-details-footer"
        >
          <footer className={styles.footerActions}>
            <OrganizerModal
              eventTitle={event.title}
              organizer={organizer}
              trigger={
                <Button
                  leftIcon={<MessageCircle aria-hidden size={20} />}
                  size="lg"
                  variant="outline"
                >
                  {t("event.contactOrganizer")}
                </Button>
              }
            />
            {primaryAction && PrimaryIcon ? (
              <Button
                leftIcon={<PrimaryIcon aria-hidden size={22} />}
                size="lg"
                variant={primaryAction.variant}
                onClick={handlePrimaryActionClick}
              >
                {primaryAction.label}
              </Button>
            ) : null}
          </footer>

          <p className={styles.securityNote}>
            <Lock aria-hidden size={16} />
            {t("event.trust")}
          </p>
        </div>
      </div>

      <Modal
        className={styles.bookingBody}
        contentClassName={styles.bookingContent}
        layer="nested"
        open={bookingOpen}
        showCloseButton
        size="lg"
        title={t("event.booking.title")}
        onOpenChange={handleBookingOpenChange}
      >
        <form
          className={styles.bookingFlow}
          data-mobile-layout="compact-booking"
          data-testid="event-booking-flow"
          noValidate
          onSubmit={handleBookingSubmit}
        >
          <div
            aria-label={t("event.booking.title")}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={bookingProgress}
            className={styles.bookingProgress}
            role="progressbar"
          >
            <span style={{ width: `${bookingProgress}%` }} />
          </div>

          <header className={styles.bookingHeader}>
            <span>
              {bookingStep === 1 ? t("event.booking.dataStep") : t("event.booking.paymentStep")}
            </span>
            <h2>{event.title}</h2>
            <p>
              {bookingStep === 1 ? t("event.booking.dataIntro") : t("event.booking.paymentIntro")}
            </p>
          </header>

          <div
            className={styles.bookingEventSummary}
            data-mobile-density="compact"
            data-testid="event-booking-summary"
          >
            <div>
              <CalendarDays aria-hidden size={19} />
              <span>
                <small>{t("event.labels.date")}</small>
                <strong>{formatEventDate(event, dateLocale)}</strong>
              </span>
            </div>
            <div>
              <Clock3 aria-hidden size={19} />
              <span>
                <small>{t("event.labels.time")}</small>
                <strong>{getBookingTimeRange(event, dateLocale)}</strong>
              </span>
            </div>
            <div>
              <MapPin aria-hidden size={19} />
              <span>
                <small>{t("event.booking.location")}</small>
                <strong>{event.venueName}</strong>
                <em>{event.venueAddress}</em>
              </span>
            </div>
          </div>

          {bookingStep === 1 ? (
            <div className={styles.bookingFormGrid}>
              <Input
                autoComplete="given-name"
                label={t("common.form.firstName")}
                required
                value={participant.firstName}
                onChange={(inputEvent) =>
                  updateParticipant("firstName", inputEvent.currentTarget.value)
                }
              />
              <Input
                autoComplete="family-name"
                label={t("common.form.lastName")}
                required
                value={participant.lastName}
                onChange={(inputEvent) =>
                  updateParticipant("lastName", inputEvent.currentTarget.value)
                }
              />
              <Input
                autoComplete="tel"
                error={participantErrors.phone}
                label={t("common.form.phone")}
                required
                type="tel"
                value={participant.phone}
                onChange={(inputEvent) =>
                  updateParticipant("phone", inputEvent.currentTarget.value)
                }
              />
              <Input
                autoComplete="email"
                error={participantErrors.email}
                label="Email"
                required
                type="email"
                value={participant.email}
                onChange={(inputEvent) =>
                  updateParticipant("email", inputEvent.currentTarget.value)
                }
              />
              <Select
                className={styles.bookingGenderField ?? ""}
                label={t("home.waitlist.gender")}
                options={genderOptions}
                placeholder={t("home.waitlist.gender")}
                required
                value={participant.gender}
                onChange={(value) => updateParticipant("gender", value)}
              />
            </div>
          ) : (
            <div className={styles.bookingPaymentGrid}>
              <section className={styles.bookingPaymentCard}>
                <div className={styles.bookingPriceLine}>
                  <span>{t("event.booking.price")}</span>
                  <strong>{event.priceLabel}</strong>
                </div>
                <div className={styles.bookingPriceMeta}>
                  <span>{t("event.booking.welcomeDrink")}</span>
                  <span>{t("event.booking.confirmedAfterPayment")}</span>
                </div>
              </section>

              <Input
                label={t("event.booking.promoCode")}
                placeholder={t("event.booking.promoPlaceholder")}
                value={promoCode}
                onChange={(inputEvent) => setPromoCode(inputEvent.currentTarget.value)}
              />

              {bookingMessage ? (
                <p className={styles.bookingStatus} data-status={bookingStatus} role="status">
                  {bookingMessage}
                </p>
              ) : null}
            </div>
          )}

          <footer
            className={styles.bookingFooter}
            data-layout={bookingStep === 1 ? "single" : "split"}
            data-mobile-sticky="actions"
            data-testid="event-booking-footer"
          >
            {bookingStep === 2 && context === "available" ? (
              <Button
                disabled={bookingStatus === "loading"}
                size="md"
                type="button"
                variant="outline"
                onClick={() => {
                  setBookingStep(1);
                  setBookingMessage("");
                  setBookingStatus("idle");
                }}
              >
                {t("common.actions.back")}
              </Button>
            ) : null}
            <Button
              className={styles.bookingSubmitButton}
              disabled={(bookingStep === 1 && !participantComplete) || bookingStatus === "success"}
              isLoading={bookingStatus === "loading"}
              leftIcon={
                bookingStep === 1 ? (
                  <CreditCard aria-hidden size={18} />
                ) : (
                  <Lock aria-hidden size={18} />
                )
              }
              size="md"
              type="submit"
            >
              {bookingSubmitLabel}
            </Button>
          </footer>
        </form>
      </Modal>
    </Modal>
  );
}
