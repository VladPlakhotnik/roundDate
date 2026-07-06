"use client";

import Image from "next/image";

import { useI18n } from "@/shared/i18n/I18nProvider";

import styles from "./HomeHowItWorks.module.css";

const stepKeys = [
  {
    className: styles.stepOne,
    number: "1",
    textKey: "home.howItWorks.steps.choose.text",
    titleKey: "home.howItWorks.steps.choose.title",
  },
  {
    className: styles.stepTwo,
    number: "2",
    textKey: "home.howItWorks.steps.request.text",
    titleKey: "home.howItWorks.steps.request.title",
  },
  {
    className: styles.stepThree,
    number: "3",
    textKey: "home.howItWorks.steps.arrive.text",
    titleKey: "home.howItWorks.steps.arrive.title",
  },
  {
    className: styles.stepFour,
    number: "4",
    textKey: "home.howItWorks.steps.talk.text",
    titleKey: "home.howItWorks.steps.talk.title",
  },
  {
    className: styles.stepFive,
    number: "5",
    textKey: "home.howItWorks.steps.matches.text",
    titleKey: "home.howItWorks.steps.matches.title",
  },
];

function StepCard({
  className,
  number,
  text,
  title,
}: {
  className?: string | undefined;
  number: string;
  text: string;
  title: string;
}) {
  return (
    <article className={[styles.stepCard, className].filter(Boolean).join(" ")}>
      <div className={styles.stepTitleRow}>
        <span className={styles.stepNumber}>{number}</span>
        <h3>{title}</h3>
      </div>
      <p>{text}</p>
    </article>
  );
}

export function HomeHowItWorks() {
  const { t } = useI18n();

  return (
    <section className={styles.section} id="how-it-works" aria-labelledby="how-it-works-title">
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id="how-it-works-title" className={styles.title}>
            {t("home.howItWorks.title")} <span>{t("home.howItWorks.titleAccent")}</span>
          </h2>
          <p className={styles.subtitle}>{t("home.howItWorks.subtitle")}</p>
        </header>

        <div className={styles.stage}>
          <div className={styles.visualFrame} aria-hidden>
            <Image
              className={styles.flowImage}
              src="/assets/how-it-works/flow.webp"
              alt=""
              width={1672}
              height={941}
              sizes="(max-width: 700px) 720px, (max-width: 1280px) 96vw, 1280px"
            />
          </div>

          <div className={styles.steps} aria-label={t("home.howItWorks.aria")}>
            {stepKeys.map((step) => (
              <StepCard
                className={step.className}
                key={step.number}
                number={step.number}
                text={t(step.textKey)}
                title={t(step.titleKey)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
