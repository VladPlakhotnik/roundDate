"use client";

import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";

import { contactEmail, contactEmailHref } from "@/shared/config/contact";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { BrandLogo } from "@/shared/ui/BrandLogo";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { useToast } from "@/shared/ui/Toast";

import styles from "./HomeWaitlistFooter.module.css";

function InstagramIcon() {
  return (
    <svg aria-hidden fill="none" height="20" viewBox="0 0 24 24" width="20">
      <rect height="17" rx="5" stroke="currentColor" strokeWidth="2" width="17" x="3.5" y="3.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.25" cy="6.75" fill="currentColor" r="1.15" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden fill="currentColor" height="20" viewBox="0 0 24 24" width="20">
      <path d="M13.8 21v-7.7h2.6l.4-3h-3V8.4c0-.9.3-1.5 1.5-1.5h1.6V4.2c-.8-.1-1.6-.2-2.4-.2-2.4 0-4.1 1.5-4.1 4.2v2.1H7.7v3h2.7V21h3.4Z" />
    </svg>
  );
}

const socialLinks = [
  {
    href: "https://www.instagram.com/rounddategdansk",
    icon: <InstagramIcon />,
    label: "Instagram",
  },
  {
    href: "https://www.facebook.com/rounddategdansk",
    icon: <FacebookIcon />,
    label: "Facebook",
  },
];

const legalLinks = [
  {
    href: "/regulamin",
    icon: <FileText aria-hidden size={20} strokeWidth={2.1} />,
    labelKey: "home.footer.terms",
  },
  {
    href: "/privacy",
    icon: <FileText aria-hidden size={20} strokeWidth={2.1} />,
    labelKey: "home.footer.privacyPolicy",
  },
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
  const { t } = useI18n();
  const [gender, setGender] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const toast = useToast();
  const genderOptions = [
    { label: t("common.gender.female"), value: "female" },
    { label: t("common.gender.male"), value: "male" },
    { label: t("common.gender.other"), value: "other" },
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const age = Number(String(formData.get("age") ?? "").trim());

    if (!firstName || !email || !age || !gender) {
      toast.error(t("home.waitlist.fieldsError"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t("home.waitlist.emailError"));
      return;
    }

    if (!Number.isInteger(age) || age < 18 || age > 80) {
      toast.error(t("home.waitlist.invalidAge"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/newsletter/subscriptions", {
        body: JSON.stringify({
          age,
          email,
          firstName,
          gender,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Newsletter subscription failed.");
      }

      form.reset();
      setGender("");
      setSubmitted(true);
      setSubmittedEmail(email);
      toast.success(t("home.waitlist.successToast"), t("home.waitlist.successToastDescription"));
    } catch {
      toast.error(t("home.waitlist.submitError"));
    } finally {
      setIsSubmitting(false);
    }
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
            {t("home.waitlist.noDate")}
            <span>{t("home.waitlist.titleAccent")}</span>
          </h2>

          <p className={styles.subtitle}>{t("home.waitlist.description")}</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.fields}>
              <Input
                aria-label={t("common.form.firstName")}
                leftIcon={<UserRound aria-hidden size={22} strokeWidth={2} />}
                name="firstName"
                placeholder={t("common.form.firstName")}
                required
                size="xl"
              />
              <Input
                aria-label={t("common.form.email")}
                leftIcon={<Mail aria-hidden size={22} strokeWidth={2} />}
                name="email"
                placeholder="Email"
                required
                size="xl"
                type="email"
              />
              <Input
                aria-label={t("home.waitlist.age")}
                inputMode="numeric"
                leftIcon={<CalendarDays aria-hidden size={22} strokeWidth={2} />}
                max={80}
                min={18}
                name="age"
                placeholder={t("home.waitlist.age")}
                required
                size="xl"
                type="number"
              />
              <Select
                leftIcon={<UserRound aria-hidden size={22} strokeWidth={2} />}
                name="gender"
                onChange={setGender}
                options={genderOptions}
                placeholder={t("home.waitlist.gender")}
                required
                size="xl"
                value={gender}
              />
            </div>

            <Button
              className={styles.submitButton}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              rightIcon={<ArrowRight aria-hidden size={25} strokeWidth={2.1} />}
              size="hero"
              type="submit"
            >
              {t("home.waitlist.cta")}
            </Button>

            <p className={styles.privacyLine}>
              <LockKeyhole aria-hidden size={16} strokeWidth={2.1} />
              <span>{t("home.waitlist.privacy")}</span>
            </p>

            {submitted ? (
              <div className={styles.successCard} role="status">
                <CheckCircle2 aria-hidden size={24} strokeWidth={2.2} />
                <div>
                  <strong>{t("home.waitlist.successTitle")}</strong>
                  <p>
                    {t("home.waitlist.success")}
                    {submittedEmail ? <span>{submittedEmail}</span> : null}
                  </p>
                </div>
              </div>
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
          <div className={styles.footerGrid}>
            <div className={styles.brandColumn}>
              <Button
                aria-label="RoundDate"
                as="link"
                className={styles.logoLink}
                href="/"
                variant="link"
              >
                <BrandLogo size="lg" />
              </Button>
              <p>{t("home.footer.description")}</p>
            </div>

            <div className={styles.footerColumn}>
              <h3>{t("home.footer.contact")}</h3>
              <Button
                as="link"
                href={contactEmailHref}
                leftIcon={<Mail aria-hidden size={20} strokeWidth={2.1} />}
                variant="link"
              >
                {contactEmail}
              </Button>
            </div>

            <div className={styles.footerColumn}>
              <h3>{t("home.footer.social")}</h3>
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
              <h3>{t("home.footer.legal")}</h3>
              {legalLinks.map((link) => (
                <Button
                  as="link"
                  href={link.href}
                  key={link.href}
                  leftIcon={link.icon}
                  variant="link"
                >
                  {t(link.labelKey)}
                </Button>
              ))}
            </div>
          </div>

          <div className={styles.footerBottom}>{t("home.footer.bottom")}</div>
        </footer>
      </div>
    </section>
  );
}
