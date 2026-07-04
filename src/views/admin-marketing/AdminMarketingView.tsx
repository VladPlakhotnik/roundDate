import { Check, Eye, Send } from "lucide-react";
import Link from "next/link";

import { AdminCard } from "@/admin/components/AdminCard";
import type { MarketingCampaignPageData } from "@/admin/server/marketing-campaigns";

import styles from "./AdminMarketingView.module.css";

type CampaignResult = {
  campaignId?: string | undefined;
  failed: number;
  recipients: number;
  sent: number;
  status: "duplicate" | "failed" | "no_events" | "partial_failed" | "sent";
};

type AdminMarketingViewProps = {
  campaignId: string;
  data: MarketingCampaignPageData;
  lastResult?: CampaignResult | undefined;
  sendAction: (formData: FormData) => Promise<void>;
};

function formatEventDate(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Europe/Warsaw",
  }).format(value);
}

function resultText(result: CampaignResult) {
  if (result.status === "duplicate") {
    return "Эта кампания уже была обработана. Повторная отправка заблокирована.";
  }

  if (result.status === "no_events") {
    return "Выберите хотя бы одно опубликованное мероприятие перед отправкой.";
  }

  if (result.status === "partial_failed" || result.status === "failed") {
    return `Кампания отправлена частично: ${result.sent}/${result.recipients}, ошибок: ${result.failed}.`;
  }

  return `Кампания отправлена: ${result.sent}/${result.recipients} получателей.`;
}

export function AdminMarketingView({
  campaignId,
  data,
  lastResult,
  sendAction,
}: AdminMarketingViewProps) {
  const hasAudience = data.audience.totalRecipients > 0;
  const hasEvents = data.events.length > 0;
  const canSend = hasAudience && hasEvents;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1>Рассылки</h1>
          <p>
            Ручная отправка письма New events. Письмо не привязано к публикации мероприятия:
            админ сам выбирает события, проверяет шаблон и запускает одну кампанию.
          </p>
        </div>
        <span className={styles.headerIcon}>
          <Send aria-hidden size={24} strokeWidth={2.1} />
        </span>
      </header>

      {lastResult ? (
        <div
          className={[
            styles.banner,
            lastResult.status === "sent" ? "" : styles.bannerWarning,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {resultText(lastResult)}
        </div>
      ) : null}

      <section className={styles.metrics} aria-label="Аудитория рассылки">
        <div className={styles.metric}>
          <strong>{data.audience.totalRecipients}</strong>
          <span>Всего получателей</span>
        </div>
        <div className={styles.metric}>
          <strong>{data.audience.profileRecipients}</strong>
          <span>Пользователи профиля</span>
        </div>
        <div className={styles.metric}>
          <strong>{data.audience.newsletterRecipients}</strong>
          <span>Newsletter waitlist</span>
        </div>
      </section>

      <section className={styles.templatePanel} aria-label="Email-шаблоны">
        <div>
          <h2>Шаблоны писем</h2>
          <p>
            Откройте список всех текущих email-шаблонов: там видны subject, plain-text текст и
            ссылка на полный HTML-preview. Для этой рассылки используется шаблон New events.
          </p>
        </div>
        <Link className={styles.templateLink} href="/admin/marketing/templates">
          <Eye aria-hidden size={17} strokeWidth={2.2} />
          Посмотреть шаблоны
        </Link>
      </section>

      <AdminCard>
        <AdminCard.Header>
          <div>
            <AdminCard.Title>New events campaign</AdminCard.Title>
            <AdminCard.Description>
              Выберите опубликованные будущие мероприятия и отправьте одно письмо всей opt-in
              аудитории.
            </AdminCard.Description>
          </div>
        </AdminCard.Header>
        <AdminCard.Content>
          <form className={styles.form} action={sendAction}>
            <input name="campaignId" type="hidden" value={campaignId} />

            <div className={styles.eventList}>
              {data.events.length ? (
                data.events.map((event) => (
                  <label className={styles.eventOption} key={event.id}>
                    <input
                      className={styles.eventCheckboxInput}
                      name="eventId"
                      type="checkbox"
                      value={event.id}
                    />
                    <span
                      aria-hidden="true"
                      className={styles.eventCheckboxVisual}
                      data-marketing-checkbox-visual="true"
                    >
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <span className={styles.eventOptionText}>
                      <strong>{event.title}</strong>
                      <span>
                        {formatEventDate(event.startsAt)} · {event.venueName ?? event.city}
                      </span>
                    </span>
                  </label>
                ))
              ) : (
                <div className={styles.empty}>
                  Нет опубликованных будущих мероприятий для рассылки.
                </div>
              )}
            </div>

            <button className={styles.submit} disabled={!canSend} type="submit">
              Отправить рассылку
            </button>
          </form>
        </AdminCard.Content>
      </AdminCard>
    </div>
  );
}
