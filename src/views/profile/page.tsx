import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Heart,
  MapPin,
  MessageSquare,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  EventDetailsCardTrigger,
  EventDetailsModal,
  OrganizerModal,
  type EventDetailsModalEvent,
  type EventMapLocation,
} from "@/entities/event";
import { getHomeEvents, type HomeEvent } from "@/entities/events";
import { Button } from "@/shared/ui/Button";

import styles from "./ProfileView.module.css";

const eventImages = [
  "/assets/atmosphere/conversation-03.png",
  "/assets/atmosphere/gdansk-evening.png",
  "/assets/atmosphere/conversation-06.png",
  "/assets/atmosphere/welcome-board.png",
];

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
    center: [18.6084, 54.3793],
    cityLabel: "Гданьск",
    districtLabel: "Wrzeszcz",
    marker: [18.6084, 54.3793],
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

function formatRecommendedMeta(event: HomeEvent) {
  return `${event.dateLabel}, ${event.weekdayLabel.slice(0, 2).toLowerCase()} · ${event.timeLabel}`;
}

function eventToDetailsEvent(event: HomeEvent, index: number): EventDetailsModalEvent {
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
    language: event.language,
    locationLabel: `${mapLocation.cityLabel}, ${mapLocation.districtLabel}`,
    mapLocation,
    priceLabel: event.priceLabel,
    spotsAvailable: event.spotsAvailable,
    startsAt: event.startsAt,
    statusLabel: event.statusLabel,
    timeLabel: event.timeLabel,
    title: event.title,
    venueAddress: mapLocation.venueAddress,
    venueName: mapLocation.venueLabel,
    weekdayLabel: event.weekdayLabel,
  };
}

export async function ProfileView() {
  const events = await getHomeEvents();
  const featuredEvent = events[0];
  const recommendedEvents = events.slice(0, 3);
  const featuredDetailsEvent = featuredEvent ? eventToDetailsEvent(featuredEvent, 0) : undefined;

  return (
    <>
      {featuredEvent ? (
        <section
          className={styles.featuredCard}
          data-clickable="true"
          aria-labelledby="featured-event-title"
        >
          {featuredDetailsEvent ? (
            <EventDetailsModal
              context="booking"
              event={featuredDetailsEvent}
              status="confirmed"
              trigger={
                <button
                  aria-label={`Открыть детали ${featuredEvent.title}`}
                  className={styles.cardOverlayTrigger}
                  type="button"
                />
              }
            />
          ) : null}
          <div className={styles.featuredMedia}>
            <span className={styles.featuredBadge}>Ближайшее мероприятие</span>
            <Image
              alt=""
              className={styles.featuredImage}
              height={360}
              priority
              src={eventImages[0]!}
              width={560}
            />
          </div>

          <div className={styles.featuredInfo}>
            <div className={styles.featuredTopline}>
              <h2 className={styles.featuredTitle} id="featured-event-title">
                {featuredEvent.title}
              </h2>
              <span className={styles.confirmedBadge}>
                <CheckCircle2 aria-hidden size={19} strokeWidth={2.1} />
                Запись подтверждена
              </span>
            </div>

            <p className={styles.locationLine}>
              <MapPin aria-hidden size={22} strokeWidth={2.1} />
              {featuredEvent.locationLabel}
            </p>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <CalendarDays aria-hidden size={23} />
                <span>
                  <strong>
                    {featuredEvent.dateLabel}, {featuredEvent.weekdayLabel.slice(0, 2)}
                  </strong>
                  <small>Дата</small>
                </span>
              </div>
              <div className={styles.detailItem}>
                <Clock3 aria-hidden size={23} />
                <span>
                  <strong>{featuredEvent.timeLabel}</strong>
                  <small>Время начала</small>
                </span>
              </div>
              <div className={styles.detailItem}>
                <Building2 aria-hidden size={23} />
                <span>
                  <strong>{featuredEvent.venueName}</strong>
                  <small>
                    {featuredEvent.city}, {featuredEvent.venueAddress}
                  </small>
                </span>
              </div>
            </div>

            <p className={styles.spotsLine}>
              <UsersRound aria-hidden size={24} />
              Осталось мест: <strong>{featuredEvent.spotsAvailable}</strong> из{" "}
              {featuredEvent.capacityTotal}
            </p>

            <div className={styles.featuredActions}>
              {featuredDetailsEvent ? (
                <EventDetailsModal
                  context="booking"
                  event={featuredDetailsEvent}
                  status="confirmed"
                  trigger={
                    <Button rightIcon={<ArrowRight aria-hidden size={18} />} size="lg">
                      Посмотреть детали
                    </Button>
                  }
                />
              ) : null}
              <Button leftIcon={<X aria-hidden size={17} />} size="lg" variant="outline">
                Отменить участие
              </Button>
              <OrganizerModal
                eventTitle={featuredEvent.title}
                trigger={
                  <Button
                    leftIcon={<MessageSquare aria-hidden size={18} />}
                    size="lg"
                    variant="outline"
                  >
                    Связаться с организатором
                  </Button>
                }
              />
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.emptyState}>
          <h2>Пока нет запланированных мероприятий</h2>
          <p>Когда вы запишетесь на событие, оно появится на главной странице профиля.</p>
        </section>
      )}

      <section className={styles.recommendations} id="events" aria-labelledby="recommended-title">
        <div className={styles.sectionHeader}>
          <h2 id="recommended-title">
            Рекомендованные ближайшие мероприятия
            <Heart aria-hidden size={20} />
          </h2>
          <Link className={styles.allEventsLink} href="/profile/events">
            Смотреть все
            <ArrowRight aria-hidden size={18} />
          </Link>
        </div>

        <div className={styles.recommendationGrid}>
          {recommendedEvents.map((event, index) => {
            const detailsEvent = eventToDetailsEvent(event, index);

            return (
              <EventDetailsCardTrigger
                ariaLabel={`Открыть детали ${event.title}`}
                className={styles.recommendationCard}
                event={detailsEvent}
                key={event.id}
              >
                <div className={styles.recommendationTop}>
                  <Image
                    alt=""
                    className={styles.recommendationImage}
                    height={160}
                    src={eventImages[index + 1] ?? eventImages[1]!}
                    width={160}
                  />
                  <div>
                    <span className={styles.recommendationBadge}>
                      {index === 0 ? "Популярное" : index === 1 ? "Новая дата" : "Last chance"}
                    </span>
                    <h3>{event.title}</h3>
                    <p>
                      <MapPin aria-hidden size={16} />
                      {event.locationLabel}
                    </p>
                    <p>
                      <CalendarDays aria-hidden size={16} />
                      {formatRecommendedMeta(event)}
                    </p>
                    <p>
                      <Building2 aria-hidden size={16} />
                      {event.venueName}
                    </p>
                  </div>
                </div>

                <div className={styles.recommendationFooter}>
                  <span>
                    <UsersRound aria-hidden size={19} />
                    Осталось мест: <strong>{event.spotsAvailable}</strong>
                  </span>
                  <strong className={styles.price}>{event.priceLabel}</strong>
                </div>
              </EventDetailsCardTrigger>
            );
          })}
        </div>
      </section>
    </>
  );
}
