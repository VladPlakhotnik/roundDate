import { notFound } from "next/navigation";

import type { HomeEvent } from "@/entities/events";
import { contactEmail } from "@/shared/config/contact";
import { HomeAtmosphere } from "@/widgets/home-atmosphere";
import { HomeEvents } from "@/widgets/home-events";
import { HomeHero } from "@/widgets/home-hero";
import { HomeHowItWorks } from "@/widgets/home-how-it-works";
import { HomeWaitlistFooter } from "@/widgets/home-waitlist-footer";
import { HomeWhyBetter } from "@/widgets/home-why-better";

import styles from "@/views/home/page.module.css";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Landing events preview | RoundDate",
};

const previewEvents: HomeEvent[] = [
  {
    address: "ul. Chlebnicka 10/11, Gdańsk",
    ageMax: 35,
    ageMin: 25,
    ageRange: "25-35",
    badge: "Trwa nabór",
    capacityTotal: 20,
    city: "Gdańsk",
    conversationMinutes: 10,
    currency: "PLN",
    dateLabel: "24 lipca",
    dateValue: "2031-07-24",
    description: "Kameralny wieczór szybkich randek w centrum miasta.",
    district: "Stare Miasto",
    durationMinutes: 120,
    femaleSpotsAvailable: 6,
    highlights: ["10-minutowe rundy", "Balans uczestników"],
    id: "preview-event-1",
    imageSrc: "/assets/home-events/chairs-date.png",
    language: "PL/EN",
    location: [18.6533, 54.3464],
    locationLabel: "Gdańsk, Stare Miasto",
    maleSpotsAvailable: 6,
    mapLocation: {
      bearing: -18,
      center: [18.6533, 54.3464],
      cityLabel: "Gdańsk",
      districtLabel: "Stare Miasto",
      marker: [18.6533, 54.3464],
      pitch: 58,
      venueAddress: "ul. Chlebnicka 10/11, Gdańsk",
      venueLabel: "Stary Spichlerz",
      zoom: 15.8,
    },
    organizer: {
      email: contactEmail,
      firstName: "Anna",
      image: null,
      lastName: "Kowalska",
      phone: "+48 500 111 222",
    },
    price: 129,
    priceLabel: "129 PLN",
    slug: "preview-rounddate-25-35",
    spotsAvailable: 12,
    startsAt: "2031-07-24T17:00:00.000Z",
    status: "published",
    statusLabel: "Są miejsca",
    tag: "closest",
    timeLabel: "19:00",
    title: "RoundDate 25-35",
    venueAddress: "ul. Chlebnicka 10/11",
    venueName: "Stary Spichlerz",
    weekdayLabel: "Czwartek",
  },
  {
    address: "ul. Słowackiego 23, Gdańsk",
    ageMax: 40,
    ageMin: 30,
    ageRange: "30-40",
    badge: "Prawie pełne",
    capacityTotal: 18,
    city: "Gdańsk",
    conversationMinutes: 10,
    currency: "PLN",
    dateLabel: "31 lipca",
    dateValue: "2031-07-31",
    description: "Przytulne spotkanie dla osób, które chcą poznać się offline.",
    district: "Wrzeszcz",
    durationMinutes: 125,
    femaleSpotsAvailable: 2,
    highlights: ["Welcome drink", "Mała grupa"],
    id: "preview-event-2",
    imageSrc: "/assets/home-events/chairs-flowers.png",
    language: "PL/EN",
    location: [18.6046, 54.381],
    locationLabel: "Gdańsk, Wrzeszcz",
    maleSpotsAvailable: 3,
    mapLocation: {
      bearing: -18,
      center: [18.6046, 54.381],
      cityLabel: "Gdańsk",
      districtLabel: "Wrzeszcz",
      marker: [18.6046, 54.381],
      pitch: 58,
      venueAddress: "ul. Słowackiego 23, Gdańsk",
      venueLabel: "Loft event space",
      zoom: 15.8,
    },
    organizer: {
      email: "events@rounddate.pl",
      firstName: "Marta",
      image: null,
      lastName: "Nowak",
      phone: "+48 500 333 444",
    },
    price: 129,
    priceLabel: "129 PLN",
    slug: "preview-rounddate-30-40",
    spotsAvailable: 5,
    startsAt: "2031-07-31T17:00:00.000Z",
    status: "published",
    statusLabel: "Są miejsca",
    tag: "closest",
    timeLabel: "19:00",
    title: "RoundDate 30-40",
    venueAddress: "ul. Słowackiego 23",
    venueName: "Loft event space",
    weekdayLabel: "Czwartek",
  },
  {
    address: "ul. Opacka 12, Gdańsk",
    ageMax: 45,
    ageMin: 35,
    ageRange: "35-45",
    badge: "Ostatnie miejsca",
    capacityTotal: 16,
    city: "Gdańsk",
    conversationMinutes: 8,
    currency: "PLN",
    dateLabel: "7 sierpnia",
    dateValue: "2031-08-07",
    description: "Spokojny format dla dojrzalszej grupy.",
    district: "Oliwa",
    durationMinutes: 110,
    femaleSpotsAvailable: 1,
    highlights: ["Przytulne stoliki", "Grupa 35-45"],
    id: "preview-event-3",
    imageSrc: "/assets/home-events/chairs-coral.png",
    language: "PL/EN",
    location: [18.5605, 54.4104],
    locationLabel: "Gdańsk, Oliwa",
    maleSpotsAvailable: 1,
    mapLocation: {
      bearing: -18,
      center: [18.5605, 54.4104],
      cityLabel: "Gdańsk",
      districtLabel: "Oliwa",
      marker: [18.5605, 54.4104],
      pitch: 58,
      venueAddress: "ul. Opacka 12, Gdańsk",
      venueLabel: "Garden lounge",
      zoom: 15.8,
    },
    organizer: {
      email: "support@rounddate.pl",
      firstName: "Kasia",
      image: null,
      lastName: "Zielinska",
      phone: "+48 500 555 666",
    },
    price: 139,
    priceLabel: "139 PLN",
    slug: "preview-rounddate-35-45",
    spotsAvailable: 2,
    startsAt: "2031-08-07T16:30:00.000Z",
    status: "published",
    statusLabel: "Są miejsca",
    tag: "closest",
    timeLabel: "18:30",
    title: "RoundDate 35-45",
    venueAddress: "ul. Opacka 12",
    venueName: "Garden lounge",
    weekdayLabel: "Czwartek",
  },
];

function normalizeCount(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const count = Number(rawValue ?? 3);

  if (!Number.isFinite(count)) {
    return 3;
  }

  return Math.max(0, Math.min(3, Math.trunc(count)));
}

export default async function LandingEventsPreviewPage({ searchParams }: PageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const events = previewEvents.slice(0, normalizeCount(params?.count));
  const featuredEvent = events[0];
  const hasEvents = events.length > 0;

  return (
    <main className={styles.root}>
      <div className={styles.topBand}>
        <HomeHero
          {...(featuredEvent ? { featuredEvent } : {})}
          hasEvents={hasEvents}
          viewer={null}
        />
        <HomeHowItWorks />
      </div>
      <div className={styles.whiteBand}>
        <HomeWhyBetter />
        {hasEvents ? <HomeEvents events={events} /> : null}
        <HomeAtmosphere />
      </div>
      <div className={styles.waitlistBand}>
        <HomeWaitlistFooter />
      </div>
    </main>
  );
}
