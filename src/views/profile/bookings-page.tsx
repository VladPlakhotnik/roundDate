import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock3,
  Heart,
  IdCard,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import Image from "next/image";

import { EventDetailsModal, type EventMapLocation } from "@/entities/event";
import { getHomeEvents, type HomeEvent } from "@/entities/events";
import { Badge, type BadgeStatus } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";

import { ProfileBookingsTabs, type ProfileBookingItem } from "./ProfileBookingsTabs";
import styles from "./ProfileView.module.css";

const eventImages = [
  "/assets/atmosphere/conversation-03.png",
  "/assets/atmosphere/gdansk-evening.png",
  "/assets/atmosphere/conversation-06.png",
  "/assets/atmosphere/welcome-board.png",
];

const bookingStatusSequence = ["confirmed", "payment-pending", "waitlist"] satisfies BadgeStatus[];

const eventMapLocations = [
  {
    bearing: -18,
    center: [18.6533, 54.3464],
    cityLabel: "Гданьск",
    districtLabel: "Старый город",
    marker: [18.6533, 54.3464],
    pitch: 58,
    venueAddress: "ul. Toruńska 12, Gdańsk",
    venueLabel: "Hotel Almond",
    zoom: 16,
  },
  {
    bearing: -18,
    center: [18.6046, 54.381],
    cityLabel: "Гданьск",
    districtLabel: "Wrzeszcz",
    marker: [18.6046, 54.381],
    pitch: 58,
    venueAddress: "ul. Grunwaldzka 87, Gdańsk",
    venueLabel: "Loft event space",
    zoom: 15.8,
  },
  {
    bearing: -18,
    center: [18.5605, 54.4104],
    cityLabel: "Гданьск",
    districtLabel: "Oliwa",
    marker: [18.5605, 54.4104],
    pitch: 58,
    venueAddress: "ul. Opacka 12, Gdańsk",
    venueLabel: "Garden lounge",
    zoom: 15.7,
  },
] satisfies EventMapLocation[];

function getBookingPaymentLabel(status: BadgeStatus, priceLabel: string) {
  if (status === "confirmed") {
    return `Оплачено: ${priceLabel}`;
  }

  if (status === "payment-pending") {
    return `Оплата: ${priceLabel}`;
  }

  return "Лист ожидания";
}

function eventToBooking(event: HomeEvent, index: number): ProfileBookingItem {
  const status = bookingStatusSequence[index] ?? "confirmed";
  const mapLocation = eventMapLocations[index] ?? eventMapLocations[0]!;

  return {
    ageRange: event.ageRange,
    capacityTotal: event.capacityTotal,
    city: event.city,
    conversationMinutes: event.conversationMinutes,
    dateLabel: event.dateLabel,
    description: event.description,
    durationMinutes: event.durationMinutes,
    highlights: event.highlights,
    id: event.id,
    imageSrc: eventImages[index] ?? eventImages[0]!,
    language: event.language,
    locationLabel: `${mapLocation.cityLabel}, ${mapLocation.districtLabel}`,
    mapLocation,
    paymentLabel: getBookingPaymentLabel(status, event.priceLabel),
    priceLabel: event.priceLabel,
    spotsAvailable: event.spotsAvailable,
    startsAt: event.startsAt,
    status,
    statusLabel: event.statusLabel,
    timeLabel: event.timeLabel,
    title: event.title,
    venueAddress: mapLocation.venueAddress,
    venueName: mapLocation.venueLabel,
    weekdayLabel: event.weekdayLabel,
    weekdayShort: event.weekdayLabel.slice(0, 2).toLowerCase(),
  };
}

function eventToPastBooking(event: HomeEvent, index: number): ProfileBookingItem {
  const pastDates = ["12 апреля", "29 марта"];
  const pastStartsAt = ["2026-04-12T19:00:00.000+02:00", "2026-03-29T19:00:00.000+02:00"];
  const pastWeekdays = ["сб", "пт"];

  return {
    ...eventToBooking(event, index),
    dateLabel: pastDates[index] ?? event.dateLabel,
    id: `past-${event.id}`,
    imageSrc: eventImages[index + 1] ?? eventImages[1]!,
    paymentLabel: "Событие завершено",
    startsAt: pastStartsAt[index] ?? event.startsAt,
    status: "confirmed",
    weekdayLabel: pastWeekdays[index] ?? event.weekdayLabel,
    weekdayShort: pastWeekdays[index] ?? event.weekdayLabel.slice(0, 2).toLowerCase(),
  };
}

export async function ProfileBookingsView() {
  const events = await getHomeEvents();
  const bookingItems = events.slice(0, 3).map(eventToBooking);
  const primaryBooking = bookingItems[0];
  const otherUpcomingBookings = bookingItems.slice(1);
  const pastBookings = events.slice(0, 2).map(eventToPastBooking);

  return (
    <section className={styles.bookingsScreen} id="bookings">
      {primaryBooking ? (
        <section className={styles.primaryBookingCard} aria-labelledby="primary-booking-title">
          <div className={styles.primaryBookingMedia}>
            <span className={styles.featuredBadge}>Ближайшее мероприятие</span>
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
                  <small>Дата</small>
                </span>
              </div>
              <div className={styles.detailItem}>
                <Clock3 aria-hidden size={23} />
                <span>
                  <strong>{primaryBooking.timeLabel}</strong>
                  <small>Время начала</small>
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
              <span>{primaryBooking.paymentLabel}</span>
              <div className={styles.bookingRowActions}>
                <Button leftIcon={<X aria-hidden size={16} />} size="sm" variant="outline">
                  Отменить участие
                </Button>
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
                      Детали
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <ProfileBookingsTabs pastBookings={pastBookings} upcomingBookings={otherUpcomingBookings} />

      <section className={styles.instructionsCard} aria-labelledby="instructions-title">
        <div className={styles.instructionsVisual} aria-hidden>
          <Image
            alt=""
            className={styles.instructionsCalendar}
            height={128}
            src="/assets/how-it-works/calendar.png"
            width={166}
          />
        </div>
        <div className={styles.instructionsIntro}>
          <h2 id="instructions-title">Инструкции перед мероприятием</h2>
          <p>Мы хотим, чтобы ваш опыт был максимально комфортным и приятным.</p>
        </div>
        <div className={styles.instructionsGrid}>
          <div>
            <Clock3 aria-hidden size={24} />
            <strong>Приходите вовремя</strong>
            <span>Рекомендуем прибыть за 15-20 минут до начала.</span>
          </div>
          <div>
            <IdCard aria-hidden size={24} />
            <strong>Возьмите документ</strong>
            <span>На входе может потребоваться удостоверение личности.</span>
          </div>
          <div>
            <Phone aria-hidden size={24} />
            <strong>Выключите телефон</strong>
            <span>Это поможет сосредоточиться на общении.</span>
          </div>
          <div>
            <Heart aria-hidden size={24} />
            <strong>Будьте собой</strong>
            <span>Искренность помогает быстрее найти подходящего человека.</span>
          </div>
        </div>
      </section>
    </section>
  );
}
