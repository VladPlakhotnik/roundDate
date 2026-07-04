import { Settings } from "lucide-react";

import { AdminPlaceholderPage } from "@/admin/components/AdminPlaceholderPage";

export default function AdminSettingsPage() {
  return (
    <AdminPlaceholderPage
      description="Раздел для системных настроек админ-панели."
      icon={Settings}
      items={[
        "Настройки уведомлений и email-сценариев.",
        "Права доступа и служебные параметры.",
        "Будущие настройки площадок и городов.",
      ]}
      title="Настройки"
    />
  );
}
