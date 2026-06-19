"use client";

import { CheckCircle2, Heart, Hourglass, MapPin, Phone } from "lucide-react";
import Image from "next/image";

import { LoadMore } from "@/shared/ui/LoadMore";

import styles from "./ProfileView.module.css";

type MatchPerson = {
  age: number;
  avatarSrc: string;
  city: string;
  id: string;
  name: string;
  phone: string;
  phoneHref: string;
};

type MatchEventBase = {
  dateLabel: string;
  eventImageSrc: string;
  id: string;
  location: string;
  timeLabel: string;
  title: string;
};

type MatchEvent =
  | (MatchEventBase & {
      matches: MatchPerson[];
      state: "matches";
    })
  | (MatchEventBase & {
      state: "empty";
    })
  | (MatchEventBase & {
      state: "pending";
      unlocksAt: string;
    });

const matchEvents = [
  {
    dateLabel: "24 мая",
    eventImageSrc: "/assets/atmosphere/conversation-03.png",
    id: "speed-dating-25-35",
    location: "Гданьск, Hotel Almond",
    matches: [
      {
        age: 28,
        avatarSrc: "/assets/profile/matches/avatar-maria.png",
        city: "Гданьск",
        id: "maria",
        name: "Мария",
        phone: "+48 512 345 678",
        phoneHref: "tel:+48512345678",
      },
      {
        age: 30,
        avatarSrc: "/assets/profile/matches/avatar-dmitry.png",
        city: "Гданьск",
        id: "dmitry",
        name: "Дмитрий",
        phone: "+48 604 765 421",
        phoneHref: "tel:+48604765421",
      },
    ],
    state: "matches",
    timeLabel: "сб, 19:00",
    title: "Speed dating 25-35",
  },
  {
    dateLabel: "14 мая",
    eventImageSrc: "/assets/atmosphere/gdansk-evening.png",
    id: "speed-dating-30-40",
    location: "Гданьск, Loft event space",
    state: "empty",
    timeLabel: "ср, 19:00",
    title: "Speed dating 30-40",
  },
  {
    dateLabel: "7 мая",
    eventImageSrc: "/assets/atmosphere/conversation-06.png",
    id: "speed-dating-35-45",
    location: "Гданьск, Garden lounge",
    matches: [
      {
        age: 39,
        avatarSrc: "/assets/profile/matches/avatar-olga.png",
        city: "Гданьск",
        id: "olga",
        name: "Ольга",
        phone: "+48 731 987 643",
        phoneHref: "tel:+48731987643",
      },
    ],
    state: "matches",
    timeLabel: "ср, 19:00",
    title: "Speed dating 35-45",
  },
  {
    dateLabel: "3 мая",
    eventImageSrc: "/assets/atmosphere/welcome-board.png",
    id: "speed-dating-pending",
    location: "Гданьск, Terrace View",
    state: "pending",
    timeLabel: "сб, 19:00",
    title: "Speed dating 25-35",
    unlocksAt: "24 мая после 12:00",
  },
] satisfies MatchEvent[];

function getMatchCountLabel(count: number) {
  if (count === 1) {
    return "1 взаимная симпатия";
  }

  return `${count} взаимные симпатии`;
}

function MatchCardContent({ event }: { event: MatchEvent }) {
  if (event.state === "empty") {
    return (
      <div className={styles.matchStatePanel}>
        <div>
          <h3>Совпадений нет</h3>
          <p>На этом мероприятии взаимных симпатий не было.</p>
        </div>
        <Image
          alt=""
          className={styles.matchStateImage}
          height={97}
          src="/assets/profile/matches/no-matches-heart.png"
          width={141}
        />
      </div>
    );
  }

  if (event.state === "pending") {
    return (
      <div className={styles.matchStatePanel}>
        <div>
          <h3>Результаты ожидаются</h3>
          <p>Результаты будут доступны {event.unlocksAt}.</p>
        </div>
        <Image
          alt=""
          className={styles.matchStateImage}
          height={111}
          src="/assets/profile/matches/pending-clock.png"
          width={128}
        />
      </div>
    );
  }

  return (
    <div className={styles.matchesPanel}>
      <h3>
        {getMatchCountLabel(event.matches.length)}
        <Heart aria-hidden size={18} />
      </h3>

      <div className={styles.matchesGrid}>
        {event.matches.map((match) => (
          <article className={styles.personCard} key={match.id}>
            <div className={styles.personSummary}>
              <span className={styles.avatarWrap}>
                <Image
                  alt=""
                  className={styles.personAvatar}
                  height={64}
                  src={match.avatarSrc}
                  width={64}
                />
                <Heart aria-hidden className={styles.avatarHeart} size={16} fill="currentColor" />
              </span>
              <div>
                <h4>
                  {match.name}, {match.age}
                </h4>
                <p>{match.city}</p>
              </div>
            </div>

            <a className={styles.phonePill} href={match.phoneHref}>
              <Phone aria-hidden size={17} />
              {match.phone}
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ProfileMatchesView() {
  return (
    <section className={styles.matchesScreen} aria-labelledby="profile-section-title">
      <section className={styles.matchesInfoCard} aria-label="Как работают мэтчи">
        <Image
          alt=""
          className={styles.matchesInfoLock}
          height={197}
          priority
          src="/assets/profile/matches/privacy-lock.png"
          width={197}
        />
        <div className={styles.matchesInfoText}>
          <h2>После мероприятия вы отмечаете симпатии.</h2>
          <p>Если выбор совпал — вы получаете мэтч и контакты друг друга.</p>
        </div>
        <Image
          alt=""
          className={styles.matchesInfoHearts}
          height={100}
          priority
          src="/assets/profile/matches/hearts-cluster.png"
          width={212}
        />
      </section>

      <LoadMore items={matchEvents} label="Показать еще мэтчи">
        {(visibleMatchEvents) => (
          <div className={styles.matchesTimeline}>
            {visibleMatchEvents.map((event) => (
              <article className={styles.matchTimelineRow} key={event.id}>
                <div className={styles.matchDate}>
                  <strong>{event.dateLabel}</strong>
                  <span>{event.timeLabel}</span>
                </div>

                <div className={styles.matchTimelineMarker} data-state={event.state}>
                  <span />
                </div>

                <div className={styles.matchEventCard}>
                  <div className={styles.matchEventInfo}>
                    <Image
                      alt=""
                      className={styles.matchEventImage}
                      height={118}
                      src={event.eventImageSrc}
                      width={118}
                    />
                    <div>
                      <h2>{event.title}</h2>
                      <p className={styles.matchLocation}>
                        <MapPin aria-hidden size={18} />
                        {event.location}
                      </p>
                      <p
                        className={
                          event.state === "pending"
                            ? styles.matchStatusPending
                            : styles.matchStatusDone
                        }
                      >
                        {event.state === "pending" ? (
                          <Hourglass aria-hidden size={17} />
                        ) : (
                          <CheckCircle2 aria-hidden size={17} />
                        )}
                        {event.state === "pending" ? "Ожидаем результаты" : "Мероприятие завершено"}
                      </p>
                    </div>
                  </div>

                  <div className={styles.matchResultArea}>
                    <MatchCardContent event={event} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </LoadMore>
    </section>
  );
}
