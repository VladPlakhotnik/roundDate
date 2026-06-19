import { ArrowRight, CalendarDays, Heart, MapPin } from "lucide-react";
import Image from "next/image";

import type { HomeEvent } from "@/entities/events";
import { Button } from "@/shared/ui/Button";

import { HomeHeader } from "./HomeHeader";
import { HeroChairScene } from "./HeroChairScene";
import styles from "./HomeHero.module.css";

type HomeHeroProps = {
  featuredEvent?: HomeEvent;
  viewer?: HomeViewer | null;
};

export type HomeViewer = {
  displayName: string;
  email: string;
  image: string | null;
};

const fallbackFeaturedEvent = {
  dateLabel: "27 июня",
  locationLabel: "Гданьск, Stare Miasto",
  timeLabel: "17:00",
  weekdayLabel: "Суббота",
};

export function HomeHero({ featuredEvent, viewer }: HomeHeroProps) {
  const heroEvent = featuredEvent ?? fallbackFeaturedEvent;

  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <HomeHeader viewer={viewer} />

      <div className={styles.canvas}>
        <div className={styles.platformBase} aria-hidden="true" />
        <HeroChairScene className={styles.chairScene} />

        <div className={styles.copy}>
          <h1 id="home-hero-title" className={styles.title}>
            Быстрые встречи.
            <span>Настоящая химия.</span>
          </h1>
          <p className={styles.subtitle}>
            10 минут, чтобы почувствовать
            <br />
            больше, чем в переписке за неделю.
          </p>

          <div className={styles.actions}>
            <Button
              className={styles.primaryAction}
              size="hero"
              rightIcon={<ArrowRight aria-hidden size={24} strokeWidth={2.1} />}
            >
              Найти своё событие
            </Button>
            <a className={styles.secondaryAction} href="#how-it-works">
              Как это работает
            </a>
          </div>
        </div>

        <article
          className={`${styles.glassCard} ${styles.eventCard}`}
          aria-label="Ближайшее событие"
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
          <Button
            className={styles.detailsButton}
            variant="secondary"
            size="lg"
            rightIcon={<ArrowRight aria-hidden size={22} strokeWidth={2.1} />}
            fullWidth
          >
            Смотреть детали события
          </Button>
        </article>

        <article
          className={`${styles.glassCard} ${styles.ratingCard}`}
          aria-label="Рекомендации участников"
        >
          <div className={styles.ratingHead}>
            <span className={styles.iconBubble}>
              <Heart aria-hidden size={28} fill="currentColor" strokeWidth={1.8} />
            </span>
            <p className={styles.ratingValue}>9 из 10</p>
          </div>
          <p className={styles.ratingText}>
            участников рекомендуют
            <br />
            SpeedDate друзьям
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
          <p className={styles.storyText}>счастливых историй</p>
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
