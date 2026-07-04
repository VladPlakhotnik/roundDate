import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock3,
  Heart,
  IdCard,
  MapPin,
  Phone,
} from "lucide-react";
import Image from "next/image";
import { headers } from "next/headers";

import {
  EventDetailsModal,
  type EventDetailsModalEvent,
  type EventMapLocation,
} from "@/entities/event";
import { getUserBookings, type UserBookingEvent } from "@/entities/events";
import { getRequestTranslator } from "@/shared/i18n/server";
import { syncCheckoutSessionForCurrentUser } from "@/shared/server/payments/stripe-return";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";

import { ProfilePaymentToast, type ProfilePaymentToastNotice } from "./ProfilePaymentToast";
import { CancelBookingButton } from "./CancelBookingButton";
import { ProfileBookingsTabs, type ProfileBookingItem } from "./ProfileBookingsTabs";
import styles from "./ProfileView.module.css";

type ProfileBookingsViewProps = {
  checkoutSessionId?: string | null | undefined;
  paymentState?: string | null | undefined;
};

function bookingToDetailsEvent(booking: UserBookingEvent): EventDetailsModalEvent {
  return {
    ageRange: booking.ageRange,
    capacityTotal: booking.capacityTotal,
    city: booking.city,
    conversationMinutes: booking.conversationMinutes,
    dateLabel: booking.dateLabel,
    description: booking.description,
    durationMinutes: booking.durationMinutes,
    femaleSpotsAvailable: booking.femaleSpotsAvailable,
    highlights: booking.highlights,
    id: booking.id,
    language: booking.language,
    locationLabel: booking.locationLabel,
    maleSpotsAvailable: booking.maleSpotsAvailable,
    mapLocation: booking.mapLocation as EventMapLocation,
    organizer: booking.organizer,
    priceLabel: booking.priceLabel,
    spotsAvailable: booking.spotsAvailable,
    startsAt: booking.startsAt,
    statusLabel: booking.statusLabel,
    timeLabel: booking.timeLabel,
    title: booking.title,
    venueAddress: booking.venueAddress,
    venueName: booking.venueName,
    weekdayLabel: booking.weekdayLabel,
  };
}

function bookingToItem(booking: UserBookingEvent): ProfileBookingItem {
  return {
    ...bookingToDetailsEvent(booking),
    attendeeNumber: booking.attendeeNumber,
    bookingId: booking.bookingId,
    imageSrc: booking.imageSrc,
    paymentLabel: booking.paymentLabel,
    priceLabel: booking.priceLabel,
    status: booking.status,
    weekdayShort: booking.weekdayShort,
  };
}

function getPaymentNotice(input: {
  paymentState?: string | null | undefined;
  syncStatus?: null | string | undefined;
  t: (key: string) => string;
}): ProfilePaymentToastNotice | null {
  if (input.paymentState === "cancelled") {
    return {
      description: input.t("profile.bookings.cancelPaymentDescription"),
      title: input.t("profile.bookings.cancelPaymentTitle"),
      type: "warning",
    };
  }

  if (input.paymentState !== "success") {
    return null;
  }

  if (input.syncStatus === "processed") {
    return {
      description: input.t("profile.bookings.paymentSuccessDescription"),
      title: input.t("profile.bookings.paymentSuccessTitle"),
      type: "success",
    };
  }

  if (input.syncStatus === "not_paid") {
    return {
      description: input.t("profile.bookings.paymentConfirmingDescription"),
      title: input.t("profile.bookings.paymentConfirmingTitle"),
      type: "warning",
    };
  }

  return {
    description: input.t("profile.bookings.paymentErrorDescription"),
    title: input.t("profile.bookings.paymentErrorTitle"),
    type: "error",
  };
}

export async function ProfileBookingsView({
  checkoutSessionId,
  paymentState,
}: ProfileBookingsViewProps = {}) {
  const requestHeaders = await headers();
  const normalizedHeaders = new Headers(requestHeaders);
  const t = await getRequestTranslator();
  const syncResult =
    paymentState === "success" && checkoutSessionId
      ? await syncCheckoutSessionForCurrentUser({
          headers: normalizedHeaders,
          sessionId: checkoutSessionId,
        })
      : null;
  const paymentNotice = getPaymentNotice({
    paymentState,
    syncStatus: syncResult?.status ?? null,
    t,
  });
  const [upcomingBookings, pastBookings] = await Promise.all([
    getUserBookings({ headers: normalizedHeaders, scope: "upcoming" }),
    getUserBookings({ headers: normalizedHeaders, scope: "past" }),
  ]);
  const bookingItems = upcomingBookings.map(bookingToItem);
  const primaryBooking = bookingItems[0];
  const otherUpcomingBookings = bookingItems.slice(1);
  const pastBookingItems = pastBookings.map(bookingToItem);

  return (
    <section className={styles.bookingsScreen} id="bookings">
      {paymentNotice ? <ProfilePaymentToast notice={paymentNotice} /> : null}

      {primaryBooking ? (
        <section className={styles.primaryBookingCard} aria-labelledby="primary-booking-title">
          <div className={styles.primaryBookingMedia}>
            <span className={styles.featuredBadge}>{t("profile.bookings.featured")}</span>
            <Image
              alt=""
              className={styles.primaryBookingImage}
              height={310}
              priority
              src={primaryBooking.imageSrc}
              width={560}
            />
          </div>

          <div className={styles.primaryBookingInfo}>
            <div className={styles.featuredTopline}>
              <h2 className={styles.featuredTitle} id="primary-booking-title">
                {primaryBooking.title}
              </h2>
              <Badge status={primaryBooking.status} />
            </div>

            <p className={styles.locationLine}>
              <MapPin aria-hidden size={22} strokeWidth={2.1} />
              {primaryBooking.locationLabel}
            </p>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <CalendarDays aria-hidden size={23} />
                <span>
                  <strong>
                    {primaryBooking.dateLabel}, {primaryBooking.weekdayShort}
                  </strong>
                  <small>{t("event.labels.date")}</small>
                </span>
              </div>
              <div className={styles.detailItem}>
                <Clock3 aria-hidden size={23} />
                <span>
                  <strong>{primaryBooking.timeLabel}</strong>
                  <small>{t("profile.home.startTime")}</small>
                </span>
              </div>
              <div className={styles.detailItem}>
                <Building2 aria-hidden size={23} />
                <span>
                  <strong>{primaryBooking.venueName}</strong>
                  <small>{primaryBooking.venueAddress}</small>
                </span>
              </div>
            </div>

            <div className={styles.primaryBookingFooter}>
              <span>
                {primaryBooking.paymentLabel}
                {primaryBooking.attendeeNumber ? (
                  <strong className={styles.primaryBookingNumber}>
                    № {primaryBooking.attendeeNumber}
                  </strong>
                ) : null}
              </span>
              <div className={styles.bookingRowActions}>
                <CancelBookingButton
                  bookingId={primaryBooking.bookingId}
                  eventTitle={primaryBooking.title}
                  startsAt={primaryBooking.startsAt}
                />
                <EventDetailsModal
                  context="booking"
                  event={primaryBooking}
                  status={primaryBooking.status}
                  trigger={
                    <Button
                      rightIcon={<ArrowRight aria-hidden size={16} />}
                      size="sm"
                      variant="secondary"
                    >
                      {t("profile.bookings.details")}
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.emptyState}>
          <h2>{t("profile.bookings.emptyTitle")}</h2>
          <p>{t("profile.bookings.emptyDescription")}</p>
        </section>
      )}

      <ProfileBookingsTabs
        pastBookings={pastBookingItems}
        upcomingBookings={otherUpcomingBookings}
      />

      <section
        className={styles.instructionsCard}
        aria-labelledby="instructions-title"
        data-layout="visual-left-notes-right"
        data-testid="booking-instructions-card"
      >
        <div
          className={styles.instructionsVisual}
          aria-hidden
          data-art="calendar"
          data-decoration="none"
          data-testid="booking-instructions-visual"
        >
          <Image
            alt=""
            className={styles.instructionsCalendar}
            height={1254}
            loading="eager"
            src="/assets/profile/bookings-notes.png"
            width={1254}
          />
        </div>
        <div className={styles.instructionsContent} data-testid="booking-instructions-content">
          <div className={styles.instructionsIntro} data-testid="booking-instructions-header">
            <h2 id="instructions-title">{t("profile.bookings.instructions.title")}</h2>
            <p>{t("profile.bookings.instructions.intro")}</p>
          </div>
          <div
            className={styles.instructionsGrid}
            data-columns="4"
            data-testid="booking-instructions-list"
          >
            <div data-testid="booking-instructions-item">
              <Clock3 aria-hidden size={24} />
              <strong>{t("profile.bookings.instructions.time.title")}</strong>
              <span>{t("profile.bookings.instructions.time.text")}</span>
            </div>
            <div data-testid="booking-instructions-item">
              <IdCard aria-hidden size={24} />
              <strong>{t("profile.bookings.instructions.document.title")}</strong>
              <span>{t("profile.bookings.instructions.document.text")}</span>
            </div>
            <div data-testid="booking-instructions-item">
              <Phone aria-hidden size={24} />
              <strong>{t("profile.bookings.instructions.phone.title")}</strong>
              <span>{t("profile.bookings.instructions.phone.text")}</span>
            </div>
            <div data-testid="booking-instructions-item">
              <Heart aria-hidden size={24} />
              <strong>{t("profile.bookings.instructions.self.title")}</strong>
              <span>{t("profile.bookings.instructions.self.text")}</span>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
