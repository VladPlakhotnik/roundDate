import {
  CalendarDays,
  CircleDollarSign,
  Hourglass,
  Plus,
  ScrollText,
  UsersRound,
} from "lucide-react";

import { AdminCard } from "@/admin/components/AdminCard";
import { AdminBadge } from "@/admin/components/AdminBadge";
import { adminDiscoverySourcePeriodOptions, getAdminDashboardData } from "@/admin/server/dashboard";
import { Button } from "@/shared/ui/Button";
import { ComparisonChart } from "@/shared/ui/Charts/ComparisonChart";

import { AdminDiscoverySourceChart } from "./AdminDiscoverySourceChart";
import styles from "./page.module.css";

function formatCurrency(groszy: number) {
  return new Intl.NumberFormat("ru-RU", {
    currency: "PLN",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(groszy / 100);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Europe/Warsaw",
  }).format(date);
}

function getAuditActionLabel(action: string) {
  const labels: Record<string, string> = {
    "event.created": "Создание мероприятия",
    "event.deleted": "Удаление мероприятия",
    "event.published": "Публикация мероприятия",
    "event.updated": "Редактирование мероприятия",
    "matches.updated": "Матчи обновлены",
    "user.banned": "Блокировка пользователя",
    "user.unbanned": "Разблокировка пользователя",
    "venue.created": "Создание адреса",
    "venue.deleted": "Удаление адреса",
    "venue.updated": "Редактирование адреса",
  };

  return labels[action] ?? action;
}

function getEntityLabel(entityType: string) {
  const labels: Record<string, string> = {
    event: "Мероприятие",
    user: "Пользователь",
    venue: "Адрес",
  };

  return labels[entityType] ?? entityType;
}

export async function AdminDashboardView() {
  const dashboard = await getAdminDashboardData();
  const stats = [
    {
      description: "Оплаченные бронирования за текущий месяц",
      icon: CircleDollarSign,
      label: "Выручка за месяц",
      tone: "amber",
      value: formatCurrency(dashboard.monthlyRevenueGroszy),
    },
    {
      description: "Новые аккаунты за текущий месяц",
      icon: UsersRound,
      label: "Новые пользователи",
      tone: "blue",
      value: formatNumber(dashboard.newUsersThisMonth),
    },
    {
      description: "Будущие опубликованные события с местами",
      icon: CalendarDays,
      label: "Активные мероприятия",
      tone: "coral",
      value: formatNumber(dashboard.activeEvents),
    },
    {
      description: "Записи, которые требуют внимания администратора",
      icon: Hourglass,
      label: "Ожидают оплаты",
      tone: "green",
      value: formatNumber(dashboard.pendingPaymentBookings),
    },
  ];

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <AdminBadge size="sm" tone="neutral">
            Admin workspace
          </AdminBadge>
          <h1>Панель управления</h1>
          <p>
            Здесь будут собраны мероприятия, записи, пользователи и платежи. Интерфейс изолирован от
            основного сайта и доступен только администраторам.
          </p>
        </div>

        <Button
          as="link"
          className={styles.createButton}
          href="/admin/events"
          leftIcon={<Plus aria-hidden size={18} strokeWidth={2.2} />}
          size="lg"
        >
          Создать мероприятие
        </Button>
      </header>

      <section className={styles.statsGrid} aria-label="Ключевые показатели">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <AdminCard className={styles.statCard} key={stat.label}>
              <AdminCard.Content className={styles.statContent}>
                <span className={styles.statIcon} data-tone={stat.tone}>
                  <Icon aria-hidden size={21} strokeWidth={2.1} />
                </span>
                <span>
                  <small>{stat.label}</small>
                  <strong>{stat.value}</strong>
                  <em>{stat.description}</em>
                </span>
              </AdminCard.Content>
            </AdminCard>
          );
        })}
      </section>

      <section className={styles.chartsGrid} aria-label="Графики админ-панели">
        <ComparisonChart
          comparisonLabel="Сравнение количества успешных оплат с прошлым месяцем."
          data={dashboard.paymentChart}
          description="Количество успешных оплат по дням месяца."
          series={[
            { color: "#f04438", key: "current", label: "Оплаты в этом месяце", type: "bar" },
            {
              color: "#94a3b8",
              compareOnly: true,
              dashed: true,
              key: "previous",
              label: "Оплаты в прошлом месяце",
              type: "line",
            },
          ]}
          title="Оплаты"
        />

        <ComparisonChart
          comparisonLabel="Сравнение новых пользователей с прошлым месяцем и текущим общим числом."
          data={dashboard.userChart}
          description={`Новые пользователи по дням. Всего пользователей: ${formatNumber(dashboard.totalUsers)}.`}
          series={[
            { color: "#2563eb", key: "current", label: "Новые в этом месяце", type: "bar" },
            {
              color: "#94a3b8",
              compareOnly: true,
              dashed: true,
              key: "previous",
              label: "Новые в прошлом месяце",
              type: "line",
            },
            { color: "#f04438", key: "currentTotal", label: "Всего пользователей", type: "line" },
          ]}
          title="Пользователи"
        />
      </section>

      <section className={styles.mainGrid}>
        <AdminDiscoverySourceChart
          description="Распределение источников из онбординга. Проценты считаются от всех пользователей."
          emptyLabel="Пока нет данных об источниках пользователей."
          initialData={dashboard.discoverySourceChart}
          initialPeriod={dashboard.discoverySourcePeriod}
          initialTotal={dashboard.discoverySourceTotal}
          periodOptions={adminDiscoverySourcePeriodOptions}
          title="Откуда приходят пользователи"
          totalLabel="пользователей"
        />

        <AdminCard className={styles.panel}>
          <AdminCard.Header className={styles.panelHeader}>
            <div>
              <AdminCard.Title>Последние логи</AdminCard.Title>
              <AdminCard.Description>Кто и что поменял в админке</AdminCard.Description>
            </div>
            <ScrollText aria-hidden size={21} strokeWidth={2.1} />
          </AdminCard.Header>
          <AdminCard.Content className={styles.logsActivity}>
            <div className={styles.logOverview}>
              <span>
                <strong>{formatNumber(dashboard.latestAuditLogs.length)}</strong>
                <small>логов</small>
              </span>
              <p>
                Последние действия администраторов. Полный журнал доступен на отдельной странице.
              </p>
              <Button as="link" href="/admin/logs" size="sm" variant="outline">
                Открыть журнал
              </Button>
            </div>

            <div className={styles.recentUsers}>
              <h4>Журнал действий</h4>
              {dashboard.latestAuditLogs.length > 0 ? (
                dashboard.latestAuditLogs.map((log) => (
                  <div className={styles.recentUserItem} key={log.id}>
                    <span>
                      <strong>{getAuditActionLabel(log.action)}</strong>
                      <small>{log.summary}</small>
                    </span>
                    <em>{getEntityLabel(log.entityType)}</em>
                    <time dateTime={log.createdAt.toISOString()}>{formatTime(log.createdAt)}</time>
                  </div>
                ))
              ) : (
                <p className={styles.emptyActivity}>Логов пока нет.</p>
              )}
            </div>
          </AdminCard.Content>
        </AdminCard>
      </section>
    </div>
  );
}
