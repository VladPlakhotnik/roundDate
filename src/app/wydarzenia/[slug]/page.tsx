import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin, ShieldCheck, Users } from "lucide-react";

import { getEventBySlug, type HomeEvent } from "@/entities/events";
import { contactEmail, contactEmailHref } from "@/shared/config/contact";
import { absoluteSiteUrl, siteName } from "@/shared/config/site";
import {
  buildEventPageJsonLd,
  eventPath,
  getCityLocative,
  getEventImage,
  getEventLead,
  getEventSeoDescription,
  isPublicEvent,
  safeJsonLd,
} from "@/shared/seo/event-structured-data";

import styles from "./page.module.css";

type EventPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getEndTimeLabel(event: HomeEvent) {
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(startsAt.getTime() + event.durationMinutes * 60_000);

  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(endsAt);
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!isPublicEvent(event)) {
    return {
      robots: {
        follow: false,
        index: false,
      },
      title: "Wydarzenie",
    };
  }

  const title = `${event.title} w ${getCityLocative(event.city)}`;
  const description = getEventSeoDescription(event);
  const image = absoluteSiteUrl(`${eventPath(event)}/opengraph-image`);
  const url = absoluteSiteUrl(eventPath(event));

  return {
    alternates: {
      canonical: url,
    },
    description,
    openGraph: {
      description,
      images: [
        {
          alt: `${event.title} - ${siteName}`,
          height: 630,
          url: image,
          width: 1200,
        },
      ],
      siteName,
      title,
      type: "website",
      url,
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [image],
      title,
    },
  };
}

export default async function EventPublicPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!isPublicEvent(event)) {
    notFound();
  }

  const endTimeLabel = getEndTimeLabel(event);
  const signupLabel = event.spotsAvailable > 0 ? "Zapisz się" : "Dołącz do listy rezerwowej";

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(buildEventPageJsonLd(event)) }}
      />

      <section className={styles.hero}>
        <nav className={styles.topbar} aria-label="Nawigacja wydarzenia">
          <Link className={styles.logoLink} href="/">
            <Image src="/assets/brand/rounddate-logo-email.png" alt="" width={44} height={44} />
            <span>{siteName}</span>
          </Link>
          <Link className={styles.backLink} href="/#events">
            <ArrowLeft aria-hidden size={18} />
            Wróć do wydarzeń
          </Link>
        </nav>

        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>
              {event.city} | {event.ageRange} | {event.language}
            </p>
            <h1>{event.title}</h1>
            <p className={styles.lead}>{getEventLead(event)}</p>

            <div className={styles.heroActions}>
              <Link
                className={styles.primaryButton}
                data-analytics-event="event_booking_click"
                data-analytics-params={JSON.stringify({
                  event_slug: event.slug,
                  source: "event_page_hero",
                })}
                href="/#events"
              >
                {signupLabel}
              </Link>
              <a
                className={styles.secondaryButton}
                data-analytics-event="event_contact_click"
                data-analytics-params={JSON.stringify({
                  event_slug: event.slug,
                  source: "event_page_hero",
                })}
                href={contactEmailHref}
              >
                Zapytaj o wydarzenie
              </a>
            </div>
          </div>

          <figure className={styles.imagePanel}>
            <Image
              src={getEventImage(event)}
              alt={`${event.title} w ${event.city}`}
              width={1000}
              height={750}
              priority
            />
            <figcaption>{event.badge}</figcaption>
          </figure>
        </div>
      </section>

      <section className={styles.detailsGrid} aria-label="Najważniejsze informacje">
        <article className={styles.detailCard}>
          <CalendarDays aria-hidden size={22} />
          <span>Data</span>
          <strong>{event.dateLabel}</strong>
        </article>
        <article className={styles.detailCard}>
          <Clock3 aria-hidden size={22} />
          <span>Godzina</span>
          <strong>
            {event.timeLabel} - {endTimeLabel}
          </strong>
        </article>
        <article className={styles.detailCard}>
          <MapPin aria-hidden size={22} />
          <span>Miejsce</span>
          <strong>
            {event.venueName}, {event.venueAddress}
          </strong>
        </article>
        <article className={styles.detailCard}>
          <Users aria-hidden size={22} />
          <span>Grupa</span>
          <strong>
            {event.ageRange}, {event.spotsAvailable} wolnych miejsc
          </strong>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.storyCard}>
          <h2>Jak wygląda wieczór?</h2>
          <p>
            Spotkanie jest prowadzone w krótkich rundach rozmów. Po wydarzeniu zaznaczasz osoby,
            z którymi chcesz kontynuować kontakt, a kontakt otwiera się tylko przy wzajemnej
            sympatii.
          </p>
          <ul>
            {event.highlights.map((highlight) => (
              <li key={highlight}>
                <CheckCircle2 aria-hidden size={18} />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </article>

        <aside className={styles.bookingCard}>
          <div>
            <span className={styles.bookingEyebrow}>Cena</span>
            <strong>{event.priceLabel}</strong>
          </div>
          <p>
            Rezerwacja i płatność odbywa się w profilu RoundDate. Jeśli masz pytania, napisz do nas:
            {" "}
            <a href={contactEmailHref}>{contactEmail}</a>.
          </p>
          <Link
            className={styles.primaryButton}
            data-analytics-event="event_booking_click"
            data-analytics-params={JSON.stringify({
              event_slug: event.slug,
              source: "event_page_booking_card",
            })}
            href="/#events"
          >
            {signupLabel}
          </Link>
          <div className={styles.trustLine}>
            <ShieldCheck aria-hidden size={18} />
            Matche publikujemy dopiero po zatwierdzeniu wyników przez organizatora.
          </div>
        </aside>
      </section>
    </main>
  );
}
