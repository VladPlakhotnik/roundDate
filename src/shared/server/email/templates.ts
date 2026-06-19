import "server-only";

export type EmailTemplate = {
  html: string;
  subject: string;
  text: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderDefaultTemplate(input: {
  body: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  preheader?: string;
  title: string;
}) {
  const bodyHtml = input.body.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  const ctaHtml =
    input.ctaUrl && input.ctaLabel
      ? `<p><a href="${escapeHtml(input.ctaUrl)}">${escapeHtml(input.ctaLabel)}</a></p>`
      : "";

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body>
    ${input.preheader ? `<span style="display:none">${escapeHtml(input.preheader)}</span>` : ""}
    <main>
      <h1>${escapeHtml(input.title)}</h1>
      ${bodyHtml}
      ${ctaHtml}
    </main>
  </body>
</html>`;
}

function toText(input: { body: string[]; ctaLabel?: string; ctaUrl?: string; title: string }) {
  return [
    input.title,
    "",
    ...input.body,
    ...(input.ctaUrl && input.ctaLabel ? ["", `${input.ctaLabel}: ${input.ctaUrl}`] : []),
  ].join("\n");
}

function createTemplate(input: {
  body: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  preheader?: string;
  subject: string;
  title: string;
}): EmailTemplate {
  return {
    html: renderDefaultTemplate(input),
    subject: input.subject,
    text: toText(input),
  };
}

export function accountVerificationEmail(input: {
  name?: string | null;
  verificationUrl: string;
}) {
  const greeting = input.name ? `${input.name}, подтвердите email.` : "Подтвердите email.";

  return createTemplate({
    body: [
      greeting,
      "Перейдите по ссылке ниже, чтобы завершить регистрацию или подтвердить новый адрес почты.",
      "Если вы не запрашивали это письмо, просто игнорируйте его.",
    ],
    ctaLabel: "Подтвердить email",
    ctaUrl: input.verificationUrl,
    preheader: "Подтвердите email в SpeedDate",
    subject: "Подтвердите email в SpeedDate",
    title: "Подтверждение email",
  });
}

export function passwordResetEmail(input: { resetUrl: string }) {
  return createTemplate({
    body: [
      "Мы получили запрос на восстановление пароля.",
      "Если это были вы, перейдите по ссылке ниже и задайте новый пароль.",
      "Если вы не запрашивали восстановление, письмо можно игнорировать.",
    ],
    ctaLabel: "Сбросить пароль",
    ctaUrl: input.resetUrl,
    preheader: "Восстановление пароля SpeedDate",
    subject: "Восстановление пароля SpeedDate",
    title: "Восстановление пароля",
  });
}

export function eventReminderEmail(input: {
  eventDate: string;
  eventTitle: string;
  venueName: string;
}) {
  return createTemplate({
    body: [
      `Напоминаем о мероприятии: ${input.eventTitle}.`,
      `Дата и место: ${input.eventDate}, ${input.venueName}.`,
      "Приходите за 15-20 минут до начала и возьмите документ.",
    ],
    preheader: "Напоминание о ближайшем мероприятии",
    subject: `Напоминание: ${input.eventTitle}`,
    title: "Напоминание о мероприятии",
  });
}

export function eventResultEmail(input: { eventTitle: string; resultsUrl: string }) {
  return createTemplate({
    body: [
      `Результаты мероприятия ${input.eventTitle} уже доступны.`,
      "Откройте профиль, чтобы посмотреть мэтчи и контакты при взаимной симпатии.",
    ],
    ctaLabel: "Посмотреть результаты",
    ctaUrl: input.resultsUrl,
    preheader: "Результаты мероприятия доступны",
    subject: `Результаты: ${input.eventTitle}`,
    title: "Результаты мероприятия",
  });
}

export function marketingEmail(input: { ctaUrl: string; headline: string; text: string }) {
  return createTemplate({
    body: [input.text],
    ctaLabel: "Открыть SpeedDate",
    ctaUrl: input.ctaUrl,
    preheader: input.headline,
    subject: input.headline,
    title: input.headline,
  });
}

export function newEventsEmail(input: { eventsUrl: string; summary: string }) {
  return createTemplate({
    body: [
      input.summary,
      "Мы подобрали новые даты и мероприятия по вашим предпочтениям.",
    ],
    ctaLabel: "Посмотреть мероприятия",
    ctaUrl: input.eventsUrl,
    preheader: "Новые даты и мероприятия SpeedDate",
    subject: "Новые мероприятия SpeedDate",
    title: "Новые даты и мероприятия",
  });
}
