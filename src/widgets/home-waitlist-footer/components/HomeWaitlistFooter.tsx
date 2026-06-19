"use client";

import {
  ArrowRight,
  Bell,
  Camera,
  CalendarDays,
  Cookie,
  FileText,
  LockKeyhole,
  Mail,
  MapPin,
  Music,
  Phone,
  Send,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";

import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { useToast } from "@/shared/ui/Toast";

import styles from "./HomeWaitlistFooter.module.css";

const footerNavLinks = [
  { href: "#how-it-works", label: "Как это работает" },
  { href: "#why-better", label: "Почему это работает" },
  { href: "#events", label: "Мероприятия" },
  { href: "#atmosphere", label: "Атмосфера" },
  { href: "#waitlist", label: "Записаться" },
];

const socialLinks = [
  {
    href: "https://www.instagram.com/speeddategdansk",
    icon: <Camera aria-hidden size={20} strokeWidth={2.1} />,
    label: "Instagram",
  },
  {
    href: "https://www.facebook.com/speeddategdansk",
    icon: <UserRound aria-hidden size={20} strokeWidth={2.1} />,
    label: "Facebook",
  },
  {
    href: "https://t.me/speeddategdansk",
    icon: <Send aria-hidden size={20} strokeWidth={2.1} />,
    label: "Telegram",
  },
  {
    href: "https://www.tiktok.com/@speeddategdansk",
    icon: <Music aria-hidden size={20} strokeWidth={2.1} />,
    label: "TikTok",
  },
];

const legalLinks = [
  {
    href: "/regulamin",
    icon: <FileText aria-hidden size={20} strokeWidth={2.1} />,
    label: "Regulamin",
  },
  {
    href: "/privacy",
    icon: <FileText aria-hidden size={20} strokeWidth={2.1} />,
    label: "Polityka prywatności",
  },
  {
    href: "/cookies",
    icon: <Cookie aria-hidden size={20} strokeWidth={2.1} />,
    label: "Cookies",
  },
];

const genderOptions = [
  { label: "Женщина", value: "female" },
  { label: "Мужчина", value: "male" },
  { label: "Другое", value: "other" },
];

const floatingAssets = [
  {
    className: styles.floatChatBubble,
    height: 927,
    id: "chat-bubble",
    src: "/assets/waitlist-footer/chat-bubble.png",
    width: 928,
  },
  {
    className: styles.floatEnvelope,
    height: 862,
    id: "envelope",
    src: "/assets/waitlist-footer/envelope.png",
    width: 970,
  },
  {
    className: styles.floatHeartPedestal,
    height: 875,
    id: "heart-pedestal",
    src: "/assets/waitlist-footer/heart-pedestal.png",
    width: 830,
  },
  {
    className: styles.floatHeart,
    height: 950,
    id: "heart",
    src: "/assets/waitlist-footer/heart.png",
    width: 930,
  },
  {
    className: styles.floatPearlLeft,
    height: 867,
    id: "pearl-left",
    src: "/assets/waitlist-footer/pearl.png",
    width: 771,
  },
  {
    className: styles.floatPearlRight,
    height: 867,
    id: "pearl-right",
    src: "/assets/waitlist-footer/pearl.png",
    width: 771,
  },
  {
    className: styles.floatSparkleLeft,
    height: 933,
    id: "sparkle-left",
    src: "/assets/waitlist-footer/sparkle.png",
    width: 890,
  },
  {
    className: styles.floatSparkleRight,
    height: 933,
    id: "sparkle-right",
    src: "/assets/waitlist-footer/sparkle.png",
    width: 890,
  },
];

export function HomeWaitlistFooter() {
  const [gender, setGender] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const age = Number(String(formData.get("age") ?? "").trim());

    if (!firstName || !email || !age || !gender) {
      toast.error("Заполните все поля формы.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Введите корректный email.");
      return;
    }

    if (!Number.isInteger(age) || age < 18 || age > 80) {
      toast.error("Введите возраст от 18 до 80 лет.");
      return;
    }

    setSubmitted(true);
    toast.success("Вы в листе ожидания.", "Сообщим, когда появится подходящий вечер.");
  }

  return (
    <section className={styles.section} id="waitlist" aria-labelledby="waitlist-title">
      <div className={styles.floatingLayer} aria-hidden="true">
        {floatingAssets.map((asset) => (
          <Image
            alt=""
            className={`${styles.floatingAsset} ${asset.className}`}
            height={asset.height}
            key={asset.id}
            sizes="(max-width: 700px) 0px, (max-width: 1180px) 96px, 148px"
            src={asset.src}
            width={asset.width}
          />
        ))}
      </div>

      <div className={styles.inner}>
        <div className={styles.waitlistCard}>
          <div className={styles.badge}>
            <Bell aria-hidden size={20} strokeWidth={2.1} />
            Waitlist / newsletter
          </div>

          <h2 id="waitlist-title" className={styles.title}>
            Не подходит дата?
            <span>Сообщим о новых вечерах</span>
          </h2>

          <p className={styles.subtitle}>
            Мы подбираем гостей по возрасту и полу, чтобы в каждой встрече был комфортный баланс и
            взаимный интерес.
          </p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.fields}>
              <Input
                aria-label="Имя"
                leftIcon={<UserRound aria-hidden size={22} strokeWidth={2} />}
                name="firstName"
                placeholder="Имя"
                required
                size="xl"
              />
              <Input
                aria-label="Email"
                leftIcon={<Mail aria-hidden size={22} strokeWidth={2} />}
                name="email"
                placeholder="Email"
                required
                size="xl"
                type="email"
              />
              <Input
                aria-label="Возраст"
                inputMode="numeric"
                leftIcon={<CalendarDays aria-hidden size={22} strokeWidth={2} />}
                max={80}
                min={18}
                name="age"
                placeholder="Возраст"
                required
                size="xl"
                type="number"
              />
              <Select
                leftIcon={<UserRound aria-hidden size={22} strokeWidth={2} />}
                name="gender"
                onChange={setGender}
                options={genderOptions}
                placeholder="Пол"
                required
                size="xl"
                value={gender}
              />
            </div>

            <Button
              className={styles.submitButton}
              rightIcon={<ArrowRight aria-hidden size={25} strokeWidth={2.1} />}
              size="hero"
              type="submit"
            >
              Сообщить о новых датах
            </Button>

            <p className={styles.privacyLine}>
              <LockKeyhole aria-hidden size={16} strokeWidth={2.1} />
              <span>Мы не передаем ваши данные третьим лицам</span>
            </p>

            {submitted ? (
              <p className={styles.success} role="status">
                Спасибо. Мы сообщим, когда появится подходящий вечер.
              </p>
            ) : null}
          </form>
        </div>

        <div className={styles.waitlistDivider} aria-hidden="true">
          <Image
            alt=""
            src="/assets/waitlist-footer/waitlist-divider-orbit.png"
            width={520}
            height={190}
            sizes="(max-width: 700px) 138px, 220px"
          />
        </div>

        <footer className={styles.footer}>
          <nav className={styles.footerNav} aria-label="Навигация в футере">
            {footerNavLinks.map((link) => (
              <Button
                as="link"
                className={styles.footerNavLink}
                href={link.href}
                key={link.href}
                variant="link"
              >
                {link.label}
              </Button>
            ))}
          </nav>

          <div className={styles.footerGrid}>
            <div className={styles.brandColumn}>
              <Button as="link" className={styles.logoLink} href="/" variant="link">
                <Image src="/assets/hero/logo-cut.png" alt="SpeedDate" width={230} height={48} />
              </Button>
              <p>SpeedDate Gdańsk — живые знакомства офлайн в комфортном формате.</p>
            </div>

            <div className={styles.footerColumn}>
              <h3>Контакты</h3>
              <Button
                as="link"
                href="mailto:hello@speeddate.pl"
                leftIcon={<Mail aria-hidden size={20} strokeWidth={2.1} />}
                variant="link"
              >
                hello@speeddate.pl
              </Button>
              <Button
                as="link"
                href="tel:+48500123456"
                leftIcon={<Phone aria-hidden size={20} strokeWidth={2.1} />}
                variant="link"
              >
                +48 500 123 456
              </Button>
              <Button
                as="link"
                href="https://maps.google.com/?q=Gda%C5%84sk"
                leftIcon={<MapPin aria-hidden size={20} strokeWidth={2.1} />}
                target="_blank"
                rel="noreferrer"
                variant="link"
              >
                Gdańsk
              </Button>
            </div>

            <div className={styles.footerColumn}>
              <h3>Социальные сети</h3>
              {socialLinks.map((link) => (
                <Button
                  as="link"
                  href={link.href}
                  key={link.href}
                  leftIcon={link.icon}
                  target="_blank"
                  rel="noreferrer"
                  variant="link"
                >
                  {link.label}
                </Button>
              ))}
            </div>

            <div className={styles.footerColumn}>
              <h3>Правовая информация</h3>
              {legalLinks.map((link) => (
                <Button
                  as="link"
                  href={link.href}
                  key={link.href}
                  leftIcon={link.icon}
                  variant="link"
                >
                  {link.label}
                </Button>
              ))}
            </div>
          </div>

          <div className={styles.footerBottom}>© 2026 SpeedDate. Все права защищены.</div>
        </footer>
      </div>
    </section>
  );
}
