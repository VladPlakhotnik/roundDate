import Image, { type StaticImageData } from "next/image";

import styles from "./HomeWhyBetter.module.css";

type WhyBetterCard = {
  alt: string;
  height: number;
  image: string | StaticImageData;
  imageClassName: string | undefined;
  text: string;
  title: string;
  width: number;
};

const cards: WhyBetterCard[] = [
  {
    alt: "",
    height: 903,
    image: "/assets/why-better/phone-swipe-v2.png",
    imageClassName: styles.phoneImage,
    text: "Один вечер вместо недель переписки.",
    title: "Без бесконечных свайпов",
    width: 781,
  },
  {
    alt: "",
    height: 384,
    image: "/assets/why-better/chairs-group-v2.png",
    imageClassName: styles.chairsImage,
    text: "Люди близкого возраста и понятный формат.",
    title: "Комфортная группа",
    width: 384,
  },
  {
    alt: "",
    height: 384,
    image: "/assets/why-better/lock-key-v2.png",
    imageClassName: styles.lockImage,
    text: "Контакты открываются только при взаимной симпатии.",
    title: "Приватность",
    width: 384,
  },
  {
    alt: "",
    height: 891,
    image: "/assets/why-better/cafe-place-v2.png",
    imageClassName: styles.cafeImage,
    text: "Безопасная и спокойная атмосфера.",
    title: "Публичное место",
    width: 1202,
  },
];

function MiniCard({ alt, height, image, imageClassName, text, title, width }: WhyBetterCard) {
  return (
    <article className={styles.miniCard}>
      <div className={styles.miniImageWrap}>
        <Image
          className={`${styles.cardImage} ${imageClassName ?? ""}`}
          src={image}
          alt={alt}
          width={width}
          height={height}
          loading="eager"
        />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

export function HomeWhyBetter() {
  return (
    <section className={styles.section} id="why-better" aria-labelledby="why-better-title">
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id="why-better-title" className={styles.title}>
            Почему это работает
            <span>лучше переписок</span>
          </h2>
          <p className={styles.subtitle}>
            За один вечер становится ясно то, что в чате тянется неделями.
          </p>
        </header>

        <div className={styles.grid}>
          <article className={styles.featureCard}>
            <div className={styles.featureImageWrap}>
              <Image
                className={styles.featureImage}
                src="/assets/why-better/couple-scene-v2.png"
                alt="Пара общается на speed dating вечере"
                width={1208}
                height={952}
                loading="eager"
              />
            </div>
            <h3>Живая химия сразу</h3>
            <p>Голос, взгляд и энергия понятны быстрее, чем в чате.</p>
          </article>

          <div className={styles.cardGrid}>
            {cards.map((card) => (
              <MiniCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
