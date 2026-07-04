"use client";

import { CheckCircle2, Heart, Hourglass, MapPin, Phone } from "lucide-react";
import Image from "next/image";

import type { ProfileMatchEvent } from "@/entities/events";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { LoadMore } from "@/shared/ui/LoadMore";

import styles from "./ProfileView.module.css";

type ProfileMatchesViewProps = {
  matchEvents: ProfileMatchEvent[];
};

function getMatchCountLabel(count: number, t: (key: string, values?: Record<string, number | string>) => string) {
  if (count === 1) {
    return t("profile.matchesPage.matchCountOne");
  }

  if (count > 1 && count < 5) {
    return t("profile.matchesPage.matchCountSome", { count });
  }

  return t("profile.matchesPage.matchCountMany", { count });
}

function MatchCardContent({ event }: { event: ProfileMatchEvent }) {
  const { t } = useI18n();

  if (event.state === "empty") {
    return (
      <div className={styles.matchStatePanel}>
        <div>
          <h3>{t("profile.matchesPage.noMatchesTitle")}</h3>
          <p>{t("profile.matchesPage.noMatchesBody")}</p>
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
          <h3>{t("profile.matchesPage.pendingTitle")}</h3>
          <p>{t("profile.matchesPage.pendingBody", { date: event.unlocksAt })}</p>
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
        {getMatchCountLabel(event.matches.length, t)}
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
                <h4>{match.age ? `${match.name}, ${match.age}` : match.name}</h4>
                <p>
                  {match.city}
                  {match.attendeeNumber ? (
                    <span className={styles.personNumber}>№ {match.attendeeNumber}</span>
                  ) : null}
                </p>
              </div>
            </div>

            {match.phone && match.phoneHref ? (
              <a className={styles.phonePill} href={match.phoneHref}>
                <Phone aria-hidden size={17} />
                {match.phone}
              </a>
            ) : (
              <span className={styles.phonePillMuted}>
                <Phone aria-hidden size={17} />
                {t("profile.matchesPage.noContact")}
              </span>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

export function ProfileMatchesView({ matchEvents }: ProfileMatchesViewProps) {
  const { t } = useI18n();

  return (
    <section className={styles.matchesScreen} aria-labelledby="profile-section-title">
      <section className={styles.matchesInfoCard} aria-label={t("profile.matchesPage.howItWorksAria")}>
        <Image
          alt=""
          className={styles.matchesInfoLock}
          height={197}
          priority
          src="/assets/profile/matches/privacy-lock.png"
          width={197}
        />
        <div className={styles.matchesInfoText}>
          <h2>{t("profile.matchesPage.infoTitle")}</h2>
          <p>{t("profile.matchesPage.infoBody")}</p>
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

      {matchEvents.length > 0 ? (
        <LoadMore items={matchEvents} label={t("profile.matchesPage.loadMore")}>
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
                          {event.state === "pending"
                            ? t("profile.matchesPage.pending")
                            : t("profile.matchesPage.done")}
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
      ) : (
        <section className={styles.matchesEmptyState}>
          <h2>{t("profile.matchesPage.emptyTitle")}</h2>
          <p>{t("profile.matchesPage.emptyDescription")}</p>
        </section>
      )}
    </section>
  );
}
