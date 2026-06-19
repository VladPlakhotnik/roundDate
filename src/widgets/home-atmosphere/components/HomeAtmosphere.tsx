import Image from "next/image";

import styles from "./HomeAtmosphere.module.css";

const photos = [
  {
    alt: "Участники speed dating беседуют за столиком при свечах",
    className: styles.photoOne,
    height: 300,
    src: "/assets/atmosphere/conversation-03.png",
    width: 396,
  },
  {
    alt: "Разговор за столиком на вечере знакомств",
    className: styles.photoTwo,
    height: 246,
    src: "/assets/atmosphere/conversation-06.png",
    width: 364,
  },
  {
    alt: "Приветственная зона SpeedDate в баре",
    className: styles.photoThree,
    height: 286,
    src: "/assets/atmosphere/welcome-board.png",
    width: 438,
  },
  {
    alt: "Пара знакомится за столиком на мероприятии",
    className: styles.photoFour,
    height: 213,
    src: "/assets/atmosphere/conversation-02.png",
    width: 456,
  },
  {
    alt: "Вечерний Гданьск и свеча на террасе",
    className: styles.photoFive,
    height: 211,
    src: "/assets/atmosphere/gdansk-evening.png",
    width: 382,
  },
];

export function HomeAtmosphere() {
  return (
    <section className={styles.section} id="atmosphere" aria-labelledby="atmosphere-title">
      <Image
        className={`${styles.sparkle} ${styles.sparkleLeft}`}
        src="/assets/waitlist-footer/sparkle.png"
        alt=""
        width={160}
        height={160}
        aria-hidden
      />
      <Image
        className={`${styles.sparkle} ${styles.sparkleRight}`}
        src="/assets/waitlist-footer/sparkle.png"
        alt=""
        width={160}
        height={160}
        aria-hidden
      />

      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 id="atmosphere-title" className={styles.title}>
            Атмосфера <span>вечера</span>
          </h2>
          <p className={styles.subtitle}>
            Тёплые встречи, живые разговоры и новые знакомства в уютной атмосфере.
          </p>
        </header>

        <div className={styles.gallery} aria-label="Фотографии с мероприятий SpeedDate">
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
            <p>Легко включиться в разговор с первых минут.</p>
            <i aria-hidden>♡</i>
          </div>
        </div>
      </div>
    </section>
  );
}
