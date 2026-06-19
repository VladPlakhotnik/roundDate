import Image from "next/image";

import styles from "./HomeHowItWorks.module.css";

const steps = [
  {
    className: styles.stepOne,
    number: "1",
    text: "Подберите удобную дату и возрастную категорию.",
    title: "Выберите дату и группу",
  },
  {
    className: styles.stepTwo,
    number: "2",
    text: "Заполните короткую форму и получите подтверждение участия.",
    title: "Оставьте заявку",
  },
  {
    className: styles.stepThree,
    number: "3",
    text: "Ждём вас в уютном публичном месте.",
    title: "Приходите на встречу",
  },
  {
    className: styles.stepFour,
    number: "4",
    text: "Познакомьтесь с несколькими людьми за один вечер.",
    title: "Общайтесь",
  },
  {
    className: styles.stepFive,
    number: "5",
    text: "После события откроем контакты только при взаимной симпатии.",
    title: "Получите мэтчи",
  },
];

function StepCard({ className, number, text, title }: (typeof steps)[number]) {
  return (
    <article className={`${styles.stepCard} ${className}`}>
      <div className={styles.stepTitleRow}>
        <span className={styles.stepNumber}>{number}</span>
        <h3>{title}</h3>
      </div>
      <p>{text}</p>
    </article>
  );
}

export function HomeHowItWorks() {
  return (
    <section className={styles.section} id="how-it-works" aria-labelledby="how-it-works-title">
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id="how-it-works-title" className={styles.title}>
            Как это <span>работает</span>
          </h2>
          <p className={styles.subtitle}>Всего 5 шагов — и вы уже ближе к настоящей встрече</p>
        </header>

        <div className={styles.stage}>
          <div className={styles.visualFrame} aria-hidden>
            <Image
              className={styles.flowImage}
              src="/assets/how-it-works/flow.png"
              alt=""
              width={1672}
              height={941}
              sizes="(max-width: 700px) 720px, (max-width: 1280px) 96vw, 1280px"
            />
          </div>

          <div className={styles.steps} aria-label="Шаги участия">
            {steps.map((step) => (
              <StepCard key={step.number} {...step} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
