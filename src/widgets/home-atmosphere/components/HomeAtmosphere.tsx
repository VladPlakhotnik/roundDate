"use client";

import Image from "next/image";

import { useI18n } from "@/shared/i18n/I18nProvider";

import styles from "./HomeAtmosphere.module.css";

const photos = [
  {
    alt: "RoundDate",
    className: styles.photoOne,
    height: 300,
    src: "/assets/atmosphere/conversation-03.webp",
    width: 396,
  },
  {
    alt: "RoundDate",
    className: styles.photoTwo,
    height: 246,
    src: "/assets/atmosphere/conversation-06.webp",
    width: 364,
  },
  {
    alt: "RoundDate",
    className: styles.photoThree,
    height: 286,
    src: "/assets/atmosphere/welcome-board.webp",
    width: 438,
  },
  {
    alt: "RoundDate",
    className: styles.photoFour,
    height: 213,
    src: "/assets/atmosphere/conversation-02.webp",
    width: 456,
  },
  {
    alt: "RoundDate",
    className: styles.photoFive,
    height: 211,
    src: "/assets/atmosphere/gdansk-evening.webp",
    width: 382,
  },
];

export function HomeAtmosphere() {
  const { t } = useI18n();

  return (
    <section className={styles.section} id="atmosphere" aria-labelledby="atmosphere-title">
      <Image
        className={`${styles.sparkle} ${styles.sparkleLeft}`}
        src="/assets/waitlist-footer/sparkle.webp"
        alt=""
        width={160}
        height={160}
        aria-hidden
      />
      <Image
        className={`${styles.sparkle} ${styles.sparkleRight}`}
        src="/assets/waitlist-footer/sparkle.webp"
        alt=""
        width={160}
        height={160}
        aria-hidden
      />

      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 id="atmosphere-title" className={styles.title}>
            {t("home.atmosphere.title")} <span>{t("home.atmosphere.titleAccent")}</span>
          </h2>
          <p className={styles.subtitle}>{t("home.atmosphere.body")}</p>
        </header>

        <div className={styles.gallery} aria-label={t("home.atmosphere.aria")}>
          {photos.map((photo) => (
            <figure className={`${styles.photoCard} ${photo.className}`} key={photo.src}>
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 700px) 100vw, (max-width: 1180px) 50vw, 34vw"
              />
            </figure>
          ))}

          <div className={styles.quoteCard}>
            <span aria-hidden>“</span>
            <p>{t("home.atmosphere.caption")}</p>
            <Image
              aria-hidden
              alt=""
              className={styles.quoteHeart}
              height={160}
              src="/assets/waitlist-footer/heart.webp"
              width={160}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
