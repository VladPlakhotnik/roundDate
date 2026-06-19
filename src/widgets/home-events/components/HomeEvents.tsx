import { ArrowRight, Clock, MapPin, Users } from "lucide-react";
import Image from "next/image";

import type { HomeEvent } from "@/entities/events";
import { Badge, type BadgeTone } from "@/shared/ui/Badge";

import styles from "./HomeEvents.module.css";

type HomeEventsProps = {
  events: HomeEvent[];
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

export function HomeEvents({ events }: HomeEventsProps) {
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
            Ближайшие мероприятия
          </h2>
          <p className={styles.subtitle}>Три ближайших вечера в Гданьске - выберите свой формат.</p>
        </header>

        <div className={styles.grid}>
          {events.slice(0, 3).map((event, index) => {
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

                <div className={styles.chips} aria-label="Параметры мероприятия">
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
                  <Badge
                    className={styles.availability ?? ""}
                    leftIcon={<Clock aria-hidden size={17} />}
                    size="md"
                    tone={getEventTone(event)}
                  >
                    {event.statusLabel}
                  </Badge>
                  <span className={styles.price}>{event.priceLabel}</span>
                </div>

                <button className={styles.detailsButton} type="button">
                  Смотреть детали
                  <ArrowRight aria-hidden size={24} />
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
