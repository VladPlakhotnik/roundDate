import { ArrowLeft, ExternalLink, MailOpen } from "lucide-react";
import Link from "next/link";

import { AdminCard } from "@/admin/components/AdminCard";

import styles from "./AdminEmailTemplatesView.module.css";

export type AdminEmailTemplatePreview = {
  description: string;
  id: string;
  subject: string;
  text: string;
  title: string;
};

type AdminEmailTemplatesViewProps = {
  emails: AdminEmailTemplatePreview[];
};

export function AdminEmailTemplatesView({ emails }: AdminEmailTemplatesViewProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <Link className={styles.backLink} href="/admin/marketing">
            <ArrowLeft aria-hidden size={16} strokeWidth={2.3} />
            Назад к рассылкам
          </Link>
          <h1>Шаблоны писем</h1>
          <p>
            Здесь собраны все email-шаблоны RoundDate. В карточке видны назначение, subject,
            plain-text текст и ссылка на полный HTML-preview.
          </p>
        </div>
        <span className={styles.headerIcon}>
          <MailOpen aria-hidden size={24} strokeWidth={2.1} />
        </span>
      </header>

      <div className={styles.grid}>
        {emails.map((email) => (
          <AdminCard className={styles.templateCard} key={email.id}>
            <AdminCard.Header>
              <div>
                <span className={styles.templateId}>{email.id}</span>
                <AdminCard.Title>{email.title}</AdminCard.Title>
                <AdminCard.Description>{email.description}</AdminCard.Description>
              </div>
              <Link
                aria-label={`Open HTML preview for ${email.id}`}
                className={styles.htmlLink}
                href={`/dev/emails/${email.id}`}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden size={15} strokeWidth={2.3} />
                HTML
              </Link>
            </AdminCard.Header>
            <AdminCard.Content>
              <div className={styles.subjectBlock}>
                <span>Subject</span>
                <strong>{email.subject}</strong>
              </div>

              <div className={styles.textBlock}>
                <span>Tekst plain-text</span>
                <pre>{email.text}</pre>
              </div>
            </AdminCard.Content>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
