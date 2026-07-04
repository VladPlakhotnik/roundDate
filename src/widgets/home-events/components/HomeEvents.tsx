"use client";

import { ArrowRight, MapPin, Users } from "lucide-react";
import Image from "next/image";

import { EventGenderAvailability } from "@/entities/event";
import type { HomeEvent } from "@/entities/events";
import { AuthModal } from "@/features/auth";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Badge, type BadgeTone } from "@/shared/ui/Badge";

import styles from "./HomeEvents.module.css";

type HomeEventsProps = {
  events: HomeEvent[];
  isAuthenticated?: boolean;
};

const eventImages = [
  {
    alt: "",
    className: styles.chairsImage,
    src: "/assets/home-events/chairs-date.png",
  },
  {
    alt: "",
    className: styles.chairsSceneImage,
    src: "/assets/home-events/chairs-flowers.png",
  },
  {
    alt: "",
    className: styles.loungeImage,
    src: "/assets/home-events/chairs-coral.png",
  },
];

function getEventTone(event: HomeEvent): BadgeTone {
  if (event.status === "sold_out" || event.spotsAvailable <= 3) {
    return "warning";
  }

  return "neutral";
}

export function HomeEvents({ events, isAuthenticated = false }: HomeEventsProps) {
  const { t } = useI18n();
  const visibleEvents = events.slice(0, 3);

  return (
    <section className={styles.section} id="events" aria-labelledby="events-title">
      <Image
        className={`${styles.titleDecor} ${styles.titleHeartDecor}`}
        src="/assets/home-events/events-title-heart.png"
        alt=""
        width={512}
        height={384}
        aria-hidden
      />
      <Image
        className={`${styles.titleDecor} ${styles.titleChessDecor}`}
        src="/assets/home-events/events-title-chess.png"
        alt=""
        width={512}
        height={384}
        aria-hidden
      />

      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 id="events-title" className={styles.title}>
            {t("home.events.title")}
          </h2>
          <p className={styles.subtitle}>{t("home.events.subtitle")}</p>
        </header>

        <div className={styles.grid} data-count={visibleEvents.length} data-home-events-grid>
          {visibleEvents.map((event, index) => {
            const dateParts = event.dateLabel.split(" ");
            const day = dateParts[0] ?? "";
            const month = dateParts.slice(1).join(" ");
            const image = eventImages[index] ?? eventImages[0]!;

            return (
              <article className={styles.card} key={event.id}>
                <div className={styles.dateBadge} aria-label={event.dateLabel}>
                  <span>{day}</span>
                  <small>{month}</small>
                </div>

                <div className={styles.cardTop}>
                  <Badge
                    className={styles.statusPill ?? ""}
                    leftIcon={<span className={styles.statusDot} aria-hidden />}
                    size="md"
                    tone={getEventTone(event)}
                  >
                    {event.badge}
                  </Badge>
                </div>

                <div className={styles.imageWrap}>
                  <Image
                    className={`${styles.eventImage} ${image.className}`}
                    src={image.src}
                    alt={image.alt}
                    width={384}
                    height={384}
                  />
                </div>

                <h3>{event.title}</h3>

                <p className={styles.dateLine}>
                  {event.dateLabel}, {event.weekdayLabel.slice(0, 2).toLowerCase()} ·{" "}
                  {event.timeLabel}
                </p>

                <div className={styles.chips} aria-label={t("home.events.paramsAria")}>
                  <span>
                    <Users aria-hidden size={19} />
                    {event.ageRange}
                  </span>
                  <span>
                    <MapPin aria-hidden size={19} />
                    {event.city}, {event.venueAddress}
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <div className={styles.availabilityBlock}>
                    <span className={styles.availabilityLabel}>
                      {t("home.events.availability")}
                    </span>
                    <EventGenderAvailability
                      femaleSpotsAvailable={event.femaleSpotsAvailable}
                      maleSpotsAvailable={event.maleSpotsAvailable}
                      size="md"
                      spotsAvailable={event.spotsAvailable}
                    />
                  </div>
                  <span className={styles.price}>{event.priceLabel}</span>
                </div>

                {isAuthenticated ? (
                  <a className={styles.detailsButton} href="/profile/events">
                    {t("home.events.cta")}
                    <ArrowRight aria-hidden size={24} />
                  </a>
                ) : (
                  <AuthModal
                    trigger={
                      <button className={styles.detailsButton} type="button">
                        {t("home.events.cta")}
                        <ArrowRight aria-hidden size={24} />
                      </button>
                    }
                  />
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
