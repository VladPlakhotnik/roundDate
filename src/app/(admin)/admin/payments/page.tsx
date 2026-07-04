import { CreditCard } from "lucide-react";

import { AdminPlaceholderPage } from "@/admin/components/AdminPlaceholderPage";

export default function AdminPaymentsPage() {
  return (
    <AdminPlaceholderPage
      description="Раздел для контроля платежей, возвратов и ошибок оплаты."
      icon={CreditCard}
      items={[
        "Список платежей по статусам: paid, pending, failed, refunded.",
        "Связь платежа с записью и пользователем.",
        "Подготовка к интеграции Stripe-операций.",
      ]}
      title="Оплаты"
    />
  );
}
