import { notFound } from "next/navigation";

import { requireAdmin } from "@/admin/auth/require-admin";
import { getRequestLocale } from "@/shared/i18n/server";

import { getPreviewEmails } from "./email-previews";

export const metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Email HTML previews | RoundDate",
};

export default async function EmailPreviewLinksPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  await requireAdmin();

  const emails = getPreviewEmails(await getRequestLocale());

  return (
    <main
      style={{
        background: "#fff7f5",
        color: "#111317",
        fontFamily: "Manrope, Arial, sans-serif",
        minHeight: "100vh",
        padding: "42px 28px 64px",
      }}
    >
      <section
        style={{
          margin: "0 auto",
          maxWidth: 760,
        }}
      >
        <p
          style={{
            color: "#fc4238",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "0.08em",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          RoundDate emails
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 950, lineHeight: 1.08, margin: "10px 0 0" }}>
          Bezpośrednie HTML-e szablonów
        </h1>
        <p style={{ color: "#5f6973", fontSize: 16, fontWeight: 650, margin: "12px 0 0" }}>
          Każdy link otwiera dokładny HTML, który trafia do Resend w polu <code>html</code>.
        </p>

        <div style={{ display: "grid", gap: 12, marginTop: 28 }}>
          {emails.map((email) => (
            <a
              href={`/dev/emails/${email.id}`}
              key={email.id}
              style={{
                background: "#fff",
                border: "1px solid rgba(255,113,97,0.16)",
                borderRadius: 18,
                boxShadow: "0 14px 36px rgba(170,91,79,0.08)",
                color: "#111317",
                display: "block",
                padding: "18px 20px",
                textDecoration: "none",
              }}
            >
              <strong style={{ display: "block", fontSize: 17, fontWeight: 950 }}>
                {email.title}
              </strong>
              <span
                style={{
                  color: "#5f6973",
                  display: "block",
                  fontSize: 13,
                  fontWeight: 650,
                  marginTop: 6,
                }}
              >
                {email.description}
              </span>
              <span
                style={{
                  color: "#fc4238",
                  display: "block",
                  fontSize: 12,
                  fontWeight: 850,
                  marginTop: 8,
                }}
              >
                Subject: {email.template.subject}
              </span>
              <span
                style={{
                  color: "#111317",
                  display: "block",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  marginTop: 14,
                  textTransform: "uppercase",
                }}
              >
                Tekst plain-text
              </span>
              <pre
                style={{
                  background: "#f8fafc",
                  border: "1px solid rgba(17,19,23,0.08)",
                  borderRadius: 14,
                  color: "#5f6973",
                  fontFamily: "Manrope, Arial, sans-serif",
                  fontSize: 13,
                  fontWeight: 650,
                  lineHeight: 1.55,
                  margin: "8px 0 0",
                  maxHeight: 180,
                  overflow: "auto",
                  padding: "12px 14px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {email.template.text}
              </pre>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
