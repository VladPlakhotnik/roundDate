import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { contactEmail, contactEmailHref } from "@/shared/config/contact";
import { BrandLogo } from "@/shared/ui/BrandLogo";
import { Button } from "@/shared/ui/Button";

import type { LegalPageContent, LegalPageSlug } from "./legal-content";
import styles from "./LegalPage.module.css";

const legalNavigation: Array<{
  href: string;
  label: string;
  slug: LegalPageSlug;
}> = [
  { href: "/regulamin", label: "Regulamin", slug: "regulamin" },
  { href: "/privacy", label: "Polityka prywatności", slug: "privacy" },
];

const alternateLegalPages: Record<LegalPageSlug, (typeof legalNavigation)[number]> = {
  privacy: { href: "/regulamin", label: "Regulamin", slug: "regulamin" },
  regulamin: { href: "/privacy", label: "Polityka prywatności", slug: "privacy" },
};

export function LegalPage({ content }: { content: LegalPageContent }) {
  const alternatePage = alternateLegalPages[content.slug];

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <Link className={styles.logoLink} href="/" aria-label="RoundDate - strona główna">
          <BrandLogo priority size="md" />
        </Link>

        <nav className={styles.nav} aria-label="Dokumenty prawne">
          {legalNavigation.map((item) => (
            <Link
              aria-current={item.slug === content.slug ? "page" : undefined}
              className={styles.navLink}
              data-active={item.slug === content.slug}
              href={item.href}
              key={item.slug}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.eyebrow}>
          <ShieldCheck aria-hidden size={20} strokeWidth={2.1} />
          {content.badge}
        </div>
        <h1>{content.title}</h1>
        <p>{content.lead}</p>

        <div className={styles.metaRow}>
          <a href={contactEmailHref}>
            <Mail aria-hidden size={18} strokeWidth={2.1} />
            {contactEmail}
          </a>
        </div>

        <div className={styles.heroActions}>
          <Button
            as="link"
            href="/"
            leftIcon={<ArrowLeft aria-hidden size={20} strokeWidth={2.1} />}
            size="lg"
            variant="secondary"
          >
            Strona główna
          </Button>
          <Button as="link" href={alternatePage.href} size="lg" variant="link">
            {alternatePage.label}
          </Button>
        </div>
      </section>

      <section className={styles.summaryGrid} aria-label="Najważniejsze informacje">
        {content.summary.map((item) => (
          <div className={styles.summaryItem} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>

      <div className={styles.documentLayout}>
        <aside className={styles.toc} aria-label="Spis treści">
          <span>Na tej stronie</span>
          {content.sections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>
              {section.title}
            </a>
          ))}
        </aside>

        <article className={styles.article}>
          {content.sections.map((section, index) => (
            <section className={styles.legalSection} id={section.id} key={section.id}>
              <div className={styles.sectionNumber}>{String(index + 1).padStart(2, "0")}</div>
              <div className={styles.sectionContent}>
                <h2>{section.title}</h2>
                {section.body?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.items ? (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </article>
      </div>

      <section className={styles.contactBand} aria-labelledby="legal-contact-title">
        <div>
          <span>Masz pytanie?</span>
          <h2 id="legal-contact-title">Napisz do RoundDate</h2>
          <p>
            Jeżeli chcesz zgłosić reklamację, zapytać o swoje dane albo doprecyzować zasady
            wydarzenia, skontaktuj się z nami mailowo.
          </p>
        </div>
        <Button
          as="link"
          className={styles.contactButton}
          href={contactEmailHref}
          leftIcon={<Mail aria-hidden size={20} strokeWidth={2.1} />}
          size="lg"
          variant="secondary"
        >
          {contactEmail}
        </Button>
      </section>
    </main>
  );
}
