import type { Metadata } from "next";

import { requireAdmin } from "@/admin/auth/require-admin";
import { getRequestLocale } from "@/shared/i18n/server";
import { AdminEmailTemplatesView } from "@/views/admin-marketing/AdminEmailTemplatesView";
import { getPreviewEmails } from "@/shared/server/email/previews";

export const metadata: Metadata = {
  title: "Шаблоны писем | Admin | RoundDate",
};

export default async function AdminMarketingTemplatesPage() {
  await requireAdmin();

  const emails = getPreviewEmails(await getRequestLocale()).map((email) => ({
    description: email.description,
    id: email.id,
    subject: email.template.subject,
    text: email.template.text,
    title: email.title,
  }));

  return <AdminEmailTemplatesView emails={emails} />;
}
