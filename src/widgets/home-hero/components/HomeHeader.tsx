"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthModal } from "@/features/auth";
import { Button } from "@/shared/ui/Button";

import type { HomeViewer } from "./HomeHero";
import styles from "./HomeHero.module.css";

const navItems = [
  { href: "#how-it-works", label: "Как это работает" },
  { href: "#why-better", label: "Почему это работает" },
  { href: "#events", label: "Мероприятия" },
  { href: "#atmosphere", label: "Атмосфера" },
  { href: "#waitlist", label: "Записаться" },
];

type HomeHeaderProps = {
  viewer?: HomeViewer | null | undefined;
};

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[1]] : [parts[0]];

  return letters
    .map((part) => part?.slice(0, 1))
    .filter(Boolean)
    .join("")
    .toUpperCase();
}

export function HomeHeader({ viewer }: HomeHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;

    function updateScrolledState() {
      frame = 0;
      setIsScrolled(window.scrollY > 12);
    }

    function handleScroll() {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateScrolledState);
    }

    updateScrolledState();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <header className={styles.header} data-scrolled={isScrolled}>
      <Link className={styles.logoLink} href="/" aria-label="SpeedDate">
        <Image src="/assets/hero/logo-cut.png" alt="SpeedDate" width={230} height={48} priority />
      </Link>

      <nav className={styles.nav} aria-label="Основная навигация">
        {navItems.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>

      {viewer ? (
        <Link className={styles.profileButton} href="/profile" aria-label="Перейти в профиль">
          <span className={styles.profileAvatar} aria-hidden>
            {viewer.image ? <span style={{ backgroundImage: `url("${viewer.image}")` }} /> : null}
            {!viewer.image ? getInitials(viewer.displayName) : null}
          </span>
          <span className={styles.profileName}>{viewer.displayName}</span>
          <ArrowRight aria-hidden size={20} strokeWidth={2.1} />
        </Link>
      ) : (
        <AuthModal
          trigger={
            <Button
              className={styles.loginButton}
              variant="secondary"
              size="lg"
              rightIcon={<ArrowRight aria-hidden size={22} strokeWidth={2.1} />}
            >
              Войти
            </Button>
          }
        />
      )}
    </header>
  );
}
