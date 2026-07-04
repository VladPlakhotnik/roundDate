"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";

import { AuthModal } from "@/features/auth";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { BrandLogo } from "@/shared/ui/BrandLogo";
import { Button } from "@/shared/ui/Button";

import type { HomeViewer } from "./HomeHero";
import styles from "./HomeHero.module.css";

type HomeHeaderProps = {
  hasEvents?: boolean;
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

export function shouldSmoothScrollLogoClick(pathname: string) {
  return pathname === "/";
}

export function HomeHeader({ hasEvents = true, viewer }: HomeHeaderProps) {
  const { t } = useI18n();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navItems = [
    { href: "#how-it-works", label: t("home.nav.howItWorks") },
    { href: "#why-better", label: t("home.nav.whyBetter") },
    ...(hasEvents ? [{ href: "#events", label: t("home.nav.events") }] : []),
    { href: "#atmosphere", label: t("home.nav.atmosphere") },
    { href: "#waitlist", label: t("home.nav.waitlist") },
  ];

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

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  const profileAction = viewer ? (
    <Link className={styles.profileButton} href="/profile" aria-label={t("home.header.profile")}>
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
          variant="primary"
          size="lg"
          rightIcon={<ArrowRight aria-hidden size={22} strokeWidth={2.1} />}
        >
          {t("home.header.cta")}
        </Button>
      }
    />
  );

  function handleLogoClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!shouldSmoothScrollLogoClick(window.location.pathname)) {
      return;
    }

    event.preventDefault();
    setIsMenuOpen(false);
    window.scrollTo({ behavior: "smooth", top: 0 });
  }

  return (
    <>
      <header className={styles.header} data-scrolled={isScrolled}>
        <Link className={styles.logoLink} href="/" aria-label="RoundDate" onClick={handleLogoClick}>
          <BrandLogo priority size="md" />
        </Link>

        <nav className={styles.nav} aria-label={t("home.header.mainNav")}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.headerAction}>{profileAction}</div>

        <button
          aria-controls="home-mobile-menu"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? t("home.header.closeMenu") : t("home.header.openMenu")}
          className={styles.menuButton}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          type="button"
        >
          {isMenuOpen ? <X aria-hidden size={22} /> : <Menu aria-hidden size={22} />}
        </button>
      </header>

      <div
        className={styles.mobileMenuBackdrop}
        data-open={isMenuOpen}
        onClick={() => setIsMenuOpen(false)}
      />
      <aside
        aria-hidden={!isMenuOpen}
        className={styles.mobileMenu}
        data-open={isMenuOpen}
        id="home-mobile-menu"
      >
        <nav className={styles.mobileNav} aria-label={t("home.header.mobileNav")}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.mobileAction}>
          {viewer ? (
            <Link
              className={styles.mobileProfileLink}
              href="/profile"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className={styles.profileAvatar} aria-hidden>
                {viewer.image ? (
                  <span style={{ backgroundImage: `url("${viewer.image}")` }} />
                ) : null}
                {!viewer.image ? getInitials(viewer.displayName) : null}
              </span>
              <span>{viewer.displayName}</span>
              <ArrowRight aria-hidden size={20} strokeWidth={2.1} />
            </Link>
          ) : (
            <AuthModal
              trigger={
                <Button
                  className={styles.mobileLoginButton}
                  onClick={() => setIsMenuOpen(false)}
                  rightIcon={<ArrowRight aria-hidden size={22} strokeWidth={2.1} />}
                  size="lg"
                  variant="primary"
                  fullWidth
                >
                  {t("home.header.cta")}
                </Button>
              }
            />
          )}
        </div>
      </aside>
    </>
  );
}
