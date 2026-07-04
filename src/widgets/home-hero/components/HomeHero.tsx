"use client";

import { ArrowRight, Bell, CalendarDays, Heart, MapPin } from "lucide-react";
import Image from "next/image";

import type { HomeEvent } from "@/entities/events";
import { AuthModal } from "@/features/auth";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Button } from "@/shared/ui/Button";

import { HomeHeader } from "./HomeHeader";
import { HeroChairScene } from "./HeroChairScene";
import styles from "./HomeHero.module.css";

type HomeHeroProps = {
  featuredEvent?: HomeEvent;
  hasEvents?: boolean;
  viewer?: HomeViewer | null;
};

export type HomeViewer = {
  displayName: string;
  email: string;
  image: string | null;
};

export function HomeHero({
  featuredEvent,
  hasEvents = Boolean(featuredEvent),
  viewer,
}: HomeHeroProps) {
  const { t } = useI18n();
  const heroEvent = featuredEvent;
  const primaryHref = viewer ? "/profile/events" : heroEvent ? "#events" : "#waitlist";

  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <HomeHeader hasEvents={hasEvents} viewer={viewer} />

      <div className={styles.canvas}>
        <div className={styles.platformBase} aria-hidden="true" />
        <HeroChairScene className={styles.chairScene} />

        <div className={styles.copy}>
          <h1 id="home-hero-title" className={styles.title}>
            {t("home.hero.title")}
            <span>{t("home.hero.titleAccent")}</span>
          </h1>
          <p className={styles.subtitle}>{t("home.hero.subtitle")}</p>

          <div className={styles.actions}>
            <Button
              as="link"
              className={styles.primaryAction}
              href={primaryHref}
              size="hero"
              rightIcon={<ArrowRight aria-hidden size={24} strokeWidth={2.1} />}
            >
              {t("home.hero.ctaPrimary")}
            </Button>
            <a className={styles.secondaryAction} href="#how-it-works">
              {t("home.hero.ctaSecondary")}
            </a>
          </div>
        </div>

        {heroEvent ? (
          <article
            className={`${styles.glassCard} ${styles.eventCard}`}
            aria-label={t("home.hero.eventAria")}
          >
            <div className={styles.eventHeader}>
              <span className={styles.iconBubble}>
                <CalendarDays aria-hidden size={26} />
              </span>
              <div>
                <p className={styles.eventDate}>{heroEvent.dateLabel}</p>
                <p className={styles.eventTime}>
                  {heroEvent.weekdayLabel.toLowerCase()}, {heroEvent.timeLabel}
                </p>
              </div>
            </div>
            <div className={styles.divider} />
            <p className={styles.locationLine}>
              <MapPin aria-hidden size={21} />
              {heroEvent.locationLabel}
            </p>
            {viewer ? (
              <Button
                as="link"
                className={styles.detailsButton}
                href="/profile/events"
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRight aria-hidden size={22} strokeWidth={2.1} />}
                fullWidth
              >
                {t("home.header.cta")}
              </Button>
            ) : (
              <AuthModal
                trigger={
                  <Button
                    className={styles.detailsButton}
                    variant="secondary"
                    size="lg"
                    rightIcon={<ArrowRight aria-hidden size={22} strokeWidth={2.1} />}
                    fullWidth
                  >
                    {t("home.header.cta")}
                  </Button>
                }
              />
            )}
          </article>
        ) : (
          <article
            className={`${styles.glassCard} ${styles.eventCard} ${styles.waitlistEventCard}`}
            aria-label={t("home.hero.noEventsAria")}
          >
            <div className={styles.eventHeader}>
              <span className={styles.iconBubble}>
                <Bell aria-hidden size={26} />
              </span>
              <div>
                <p className={styles.eventDate}>{t("home.hero.noEventsTitle")}</p>
                <p className={styles.eventTime}>{t("home.hero.noEventsEyebrow")}</p>
              </div>
            </div>
            <div className={styles.divider} />
            <p className={styles.waitlistEventText}>{t("home.hero.noEventsBody")}</p>
            <Button
              as="link"
              className={styles.detailsButton}
              href="#waitlist"
              variant="secondary"
              size="lg"
              rightIcon={<ArrowRight aria-hidden size={22} strokeWidth={2.1} />}
              fullWidth
            >
              {t("home.waitlist.cta")}
            </Button>
          </article>
        )}

        <article
          className={`${styles.glassCard} ${styles.ratingCard}`}
          aria-label={t("home.hero.ratingAria")}
        >
          <div className={styles.ratingHead}>
            <span className={styles.iconBubble}>
              <Heart aria-hidden size={28} fill="currentColor" strokeWidth={1.8} />
            </span>
            <p className={styles.ratingValue}>{t("home.hero.ratingValue")}</p>
          </div>
          <p className={styles.ratingText}>
            {t("home.hero.ratingText")
              .split("\n")
              .map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
          </p>
          <div className={styles.avatarRow}>
            <Image
              className={styles.avatarImage}
              src="/assets/hero/user-avatar-1.png"
              alt=""
              width={42}
              height={42}
            />
            <Image
              className={styles.avatarImage}
              src="/assets/hero/user-avatar-2.png"
              alt=""
              width={42}
              height={42}
            />
            <Image
              className={styles.avatarImage}
              src="/assets/hero/user-avatar-3.png"
              alt=""
              width={42}
              height={42}
            />
            <span className={styles.storyPill}>10K+</span>
          </div>
          <p className={styles.storyText}>{t("home.hero.stories")}</p>
        </article>

        <div className={styles.gallery} aria-hidden="true">
          <Image
            className={`${styles.galleryImage} ${styles.galleryMain}`}
            src="/assets/hero/gallery-main-generated-v1.png"
            alt=""
            width={780}
            height={520}
            priority
            sizes="(max-width: 1200px) 0px, 430px"
          />
          <Image
            className={`${styles.galleryImage} ${styles.galleryTop}`}
            src="/assets/hero/gallery-group-v2.png"
            alt=""
            width={320}
            height={230}
            sizes="(max-width: 1200px) 0px, 150px"
          />
          <Image
            className={`${styles.galleryImage} ${styles.galleryBottom}`}
            src="/assets/hero/gallery-detail-v2.png"
            alt=""
            width={320}
            height={250}
            sizes="(max-width: 1200px) 0px, 140px"
          />
        </div>
      </div>
    </section>
  );
}
