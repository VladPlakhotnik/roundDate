"use client";

import Image, { type StaticImageData } from "next/image";

import { useI18n } from "@/shared/i18n/I18nProvider";

import styles from "./HomeWhyBetter.module.css";

type WhyBetterCard = {
  alt: string;
  height: number;
  image: string | StaticImageData;
  imageClassName: string | undefined;
  textKey: string;
  titleKey: string;
  width: number;
};

const cards: WhyBetterCard[] = [
  {
    alt: "",
    height: 903,
    image: "/assets/why-better/phone-swipe-v2.webp",
    imageClassName: styles.phoneImage,
    textKey: "home.whyBetter.items.swipes.text",
    titleKey: "home.whyBetter.items.swipes.title",
    width: 781,
  },
  {
    alt: "",
    height: 384,
    image: "/assets/why-better/chairs-group-v2.webp",
    imageClassName: styles.chairsImage,
    textKey: "home.whyBetter.items.group.text",
    titleKey: "home.whyBetter.items.group.title",
    width: 384,
  },
  {
    alt: "",
    height: 384,
    image: "/assets/why-better/lock-key-v2.webp",
    imageClassName: styles.lockImage,
    textKey: "home.whyBetter.items.privacy.text",
    titleKey: "home.whyBetter.items.privacy.title",
    width: 384,
  },
  {
    alt: "",
    height: 891,
    image: "/assets/why-better/cafe-place-v2.webp",
    imageClassName: styles.cafeImage,
    textKey: "home.whyBetter.items.place.text",
    titleKey: "home.whyBetter.items.place.title",
    width: 1202,
  },
];

function MiniCard({
  alt,
  height,
  image,
  imageClassName,
  text,
  title,
  width,
}: Omit<WhyBetterCard, "textKey" | "titleKey"> & { text: string; title: string }) {
  return (
    <article className={styles.miniCard}>
      <div className={styles.miniImageWrap}>
        <Image
          className={`${styles.cardImage} ${imageClassName ?? ""}`}
          src={image}
          alt={alt}
          width={width}
          height={height}
        />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

export function HomeWhyBetter() {
  const { t } = useI18n();

  return (
    <section className={styles.section} id="why-better" aria-labelledby="why-better-title">
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id="why-better-title" className={styles.title}>
            {t("home.whyBetter.title")}
            <span>{t("home.whyBetter.titleAccent")}</span>
          </h2>
          <p className={styles.subtitle}>{t("home.whyBetter.body")}</p>
        </header>

        <div className={styles.grid}>
          <article className={styles.featureCard}>
            <div className={styles.featureImageWrap}>
              <Image
                className={styles.featureImage}
                src="/assets/why-better/couple-scene-v2.webp"
                alt="RoundDate"
                width={1208}
                height={952}
              />
            </div>
            <h3>{t("home.whyBetter.cardTitle")}</h3>
            <p>{t("home.whyBetter.cardBody")}</p>
          </article>

          <div className={styles.cardGrid}>
            {cards.map((card) => (
              <MiniCard
                alt={card.alt}
                height={card.height}
                image={card.image}
                imageClassName={card.imageClassName}
                key={card.titleKey}
                text={t(card.textKey)}
                title={t(card.titleKey)}
                width={card.width}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
