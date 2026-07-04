import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock3,
  Heart,
  MapPin,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";

import {
  EventDetailsCardTrigger,
  EventDetailsModal,
  EventGenderAvailability,
  OrganizerModal,
  type BookingParticipantDefaults,
  type EventDetailsModalEvent,
  type EventMapLocation,
} from "@/entities/event";
import {
  getHomeEvents,
  getUserBookings,
  type HomeEvent,
  type UserBookingEvent,
} from "@/entities/events";
import { getProfileOnboardingState } from "@/entities/profile/server/onboarding";
import { getRequestTranslator } from "@/shared/i18n/server";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";

import { CancelBookingButton } from "./CancelBookingButton";
import styles from "./ProfileView.module.css";

const eventImages = [
  "/assets/atmosphere/conversation-03.png",
  "/assets/atmosphere/gdansk-evening.png",
  "/assets/atmosphere/conversation-06.png",
  "/assets/atmosphere/welcome-board.png",
];

function formatRecommendedMeta(event: HomeEvent) {
  return `${event.dateLabel}, ${event.weekdayLabel.slice(0, 2).toLowerCase()} · ${event.timeLabel}`;
}

function eventToDetailsEvent(event: HomeEvent | UserBookingEvent): EventDetailsModalEvent {
  return {
    ageRange: event.ageRange,
    capacityTotal: event.capacityTotal,
    city: event.city,
    conversationMinutes: event.conversationMinutes,
    dateLabel: event.dateLabel,
    description: event.description,
    durationMinutes: event.durationMinutes,
    femaleSpotsAvailable: event.femaleSpotsAvailable,
    highlights: event.highlights,
    id: event.id,
    language: event.language,
    locationLabel: event.locationLabel,
    maleSpotsAvailable: event.maleSpotsAvailable,
    mapLocation: event.mapLocation as EventMapLocation,
    organizer: event.organizer,
    priceLabel: event.priceLabel,
    spotsAvailable: event.spotsAvailable,
    startsAt: event.startsAt,
    statusLabel: event.statusLabel,
    timeLabel: event.timeLabel,
    title: event.title,
    venueAddress: event.venueAddress,
    venueName: event.venueName,
    weekdayLabel: event.weekdayLabel,
  };
}

async function getRequestHeaders() {
  try {
    return new Headers(await headers());
  } catch {
    return new Headers();
  }
}

function getBookingDefaults(
  onboardingState: Awaited<ReturnType<typeof getProfileOnboardingState>>,
): BookingParticipantDefaults | undefined {
  if (!onboardingState) {
    return undefined;
  }

  return {
    email: onboardingState.user.email,
    firstName: onboardingState.profile.firstName,
    gender: onboardingState.profile.gender,
    lastName: onboardingState.profile.lastName,
    phone: onboardingState.profile.phone,
  };
}

export async function ProfileView() {
  const requestHeaders = await getRequestHeaders();
  const [bookings, events, onboardingState, t] = await Promise.all([
    getUserBookings({ headers: requestHeaders, scope: "upcoming" }),
    getHomeEvents(),
    getProfileOnboardingState({ headers: requestHeaders }),
    getRequestTranslator(),
  ]);
  const bookingDefaults = getBookingDefaults(onboardingState);
  const featuredEvent = bookings[0];
  const recommendedEvents = events.slice(0, 3);
  const featuredDetailsEvent = featuredEvent ? eventToDetailsEvent(featuredEvent) : undefined;

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
              {...(bookingDefaults ? { bookingDefaults } : {})}
              context="booking"
                  event={featuredDetailsEvent}
                  status={featuredEvent.status}
                  trigger={
                    <button
                  aria-label={t("profile.home.openDetails", { title: featuredEvent.title })}
                  className={styles.cardOverlayTrigger}
                  type="button"
                />
              }
            />
          ) : null}
          <div className={styles.featuredMedia}>
            <span className={styles.featuredBadge}>{t("profile.home.featured")}</span>
            <Image
              alt=""
              className={styles.featuredImage}
              height={360}
              priority
              src={featuredEvent.imageSrc || eventImages[0]!}
              width={560}
            />
          </div>

          <div className={styles.featuredInfo}>
            <div className={styles.featuredTopline}>
              <h2 className={styles.featuredTitle} id="featured-event-title">
                {featuredEvent.title}
              </h2>
              <Badge className={styles.confirmedBadge} status={featuredEvent.status} />
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
                  <small>{t("profile.home.date")}</small>
                </span>
              </div>
              <div className={styles.detailItem}>
                <Clock3 aria-hidden size={23} />
                <span>
                  <strong>{featuredEvent.timeLabel}</strong>
                  <small>{t("profile.home.startTime")}</small>
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

            <EventGenderAvailability
              className={styles.featuredAvailability}
              femaleSpotsAvailable={featuredEvent.femaleSpotsAvailable}
              maleSpotsAvailable={featuredEvent.maleSpotsAvailable}
              spotsAvailable={featuredEvent.spotsAvailable}
            />

            <div className={styles.featuredActions}>
              {featuredDetailsEvent ? (
                <EventDetailsModal
                  {...(bookingDefaults ? { bookingDefaults } : {})}
                  context="booking"
                  event={featuredDetailsEvent}
                  status={featuredEvent.status}
                  trigger={
                    <Button rightIcon={<ArrowRight aria-hidden size={18} />} size="lg">
                      {t("profile.home.details")}
                    </Button>
                  }
                />
              ) : null}
              <CancelBookingButton
                bookingId={featuredEvent.bookingId}
                eventTitle={featuredEvent.title}
                size="lg"
                startsAt={featuredEvent.startsAt}
              />
              <OrganizerModal
                eventTitle={featuredEvent.title}
                organizer={featuredEvent.organizer}
                trigger={
                  <Button
                    leftIcon={<MessageSquare aria-hidden size={18} />}
                    size="lg"
                    variant="outline"
                  >
                    {t("profile.home.contactOrganizer")}
                  </Button>
                }
              />
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.emptyState}>
          <h2>{t("profile.home.emptyTitle")}</h2>
          <p>{t("profile.home.emptyDescription")}</p>
        </section>
      )}

      <section className={styles.recommendations} id="events" aria-labelledby="recommended-title">
        <div className={styles.sectionHeader}>
          <h2 id="recommended-title">
            {t("profile.home.recommended")}
            <Heart aria-hidden size={20} />
          </h2>
          <Link className={styles.allEventsLink} href="/profile/events">
            {t("profile.home.allEvents")}
            <ArrowRight aria-hidden size={18} />
          </Link>
        </div>

        <div className={styles.recommendationGrid}>
          {recommendedEvents.map((event, index) => {
            const detailsEvent = eventToDetailsEvent(event);

            return (
              <EventDetailsCardTrigger
                ariaLabel={t("profile.home.openDetails", { title: event.title })}
                {...(bookingDefaults ? { bookingDefaults } : {})}
                className={styles.recommendationCard}
                event={detailsEvent}
                key={event.id}
              >
                <div className={styles.recommendationTop} key="recommendation-top">
                  <Image
                    alt=""
                    className={styles.recommendationImage}
                    height={160}
                    src={event.imageSrc || eventImages[index + 1] || eventImages[1]!}
                    width={160}
                  />
                  <div>
                    <span className={styles.recommendationBadge}>
                      {index === 0
                        ? t("profile.home.popular")
                        : index === 1
                          ? t("profile.home.newDate")
                          : t("profile.home.lastChance")}
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

                <div className={styles.recommendationFooter} key="recommendation-footer">
                  <EventGenderAvailability
                    className={styles.recommendationAvailability}
                    femaleSpotsAvailable={event.femaleSpotsAvailable}
                    maleSpotsAvailable={event.maleSpotsAvailable}
                    size="sm"
                    spotsAvailable={event.spotsAvailable}
                  />
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
