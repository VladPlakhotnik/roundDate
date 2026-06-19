"use client";

import { ArrowRight, Building2, CalendarDays, Clock3, History, MapPin, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { EventDetailsModal, type EventDetailsModalEvent } from "@/entities/event";
import { Badge, type BadgeStatus } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { LoadMore } from "@/shared/ui/LoadMore";

import styles from "./ProfileView.module.css";

export type ProfileBookingItem = EventDetailsModalEvent & {
  imageSrc: string;
  paymentLabel: string;
  priceLabel: string;
  status: BadgeStatus;
  weekdayShort: string;
};

type ProfileBookingsTabsProps = {
  pastBookings: ProfileBookingItem[];
  upcomingBookings: ProfileBookingItem[];
};

type BookingTab = "upcoming" | "past";

function BookingRow({ booking, past = false }: { booking: ProfileBookingItem; past?: boolean }) {
  return (
    <article className={styles.bookingRow}>
      <div className={styles.bookingSummary}>
        <Image
          alt=""
          className={styles.bookingRowImage}
          height={128}
          src={booking.imageSrc}
          width={180}
        />
        <div>
          <h3>{booking.title}</h3>
          <p>
            <MapPin aria-hidden size={17} />
            {booking.locationLabel}
          </p>
        </div>
      </div>

      <div className={styles.bookingRowDetails}>
        <div className={styles.bookingDetail}>
          <CalendarDays aria-hidden size={21} />
          <span>
            <strong>
              {booking.dateLabel}, {booking.weekdayShort}
            </strong>
            <small>Дата</small>
          </span>
        </div>
        <div className={styles.bookingDetail}>
          <Clock3 aria-hidden size={21} />
          <span>
            <strong>{booking.timeLabel}</strong>
            <small>Время начала</small>
          </span>
        </div>
        <div className={styles.bookingDetail}>
          <Building2 aria-hidden size={21} />
          <span>
            <strong>{booking.venueName}</strong>
            <small>{booking.venueAddress}</small>
          </span>
        </div>
      </div>

      <div className={styles.bookingRowFooter}>
        <div className={styles.bookingPayment}>
          <span>{booking.paymentLabel}</span>
          <Badge size="sm" status={booking.status} />
        </div>
        <div className={styles.bookingRowActions}>
          {!past ? (
            <Button leftIcon={<X aria-hidden size={16} />} size="sm" variant="outline">
              Отменить участие
            </Button>
          ) : null}
          <EventDetailsModal
            context={past ? "past" : "booking"}
            event={booking}
            status={booking.status}
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
    </article>
  );
}

export function ProfileBookingsTabs({ pastBookings, upcomingBookings }: ProfileBookingsTabsProps) {
  const [activeTab, setActiveTab] = useState<BookingTab>("upcoming");
  const bookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <section className={styles.bookingTabsBlock} aria-labelledby="booking-tabs-title">
      <div className={styles.bookingTabsHeader}>
        <h2 id="booking-tabs-title">
          {activeTab === "upcoming" ? "Другие предстоящие записи" : "Прошедшие события"}
        </h2>

        <div className={styles.bookingTabs} role="tablist" aria-label="Фильтр записей">
          <button
            aria-selected={activeTab === "upcoming"}
            className={activeTab === "upcoming" ? styles.bookingTabActive : styles.bookingTab}
            role="tab"
            type="button"
            onClick={() => setActiveTab("upcoming")}
          >
            <CalendarDays aria-hidden size={18} />
            Предстоящие
          </button>
          <button
            aria-selected={activeTab === "past"}
            className={activeTab === "past" ? styles.bookingTabActive : styles.bookingTab}
            role="tab"
            type="button"
            onClick={() => setActiveTab("past")}
          >
            <History aria-hidden size={18} />
            Прошедшие
          </button>
        </div>
      </div>

      <LoadMore
        items={bookings}
        label={activeTab === "upcoming" ? "Показать еще записи" : "Показать еще события"}
        resetKey={activeTab}
      >
        {(visibleBookings) => (
          <div className={styles.bookingList}>
            {visibleBookings.map((booking) => (
              <BookingRow booking={booking} key={booking.id} past={activeTab === "past"} />
            ))}
          </div>
        )}
      </LoadMore>
    </section>
  );
}
