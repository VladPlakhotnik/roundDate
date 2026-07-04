import type { LucideIcon } from "lucide-react";

import { AdminBadge } from "@/admin/components/AdminBadge";
import { AdminCard } from "@/admin/components/AdminCard";

import styles from "./AdminPlaceholderPage.module.css";

type AdminPlaceholderPageProps = {
  description: string;
  icon: LucideIcon;
  items: string[];
  title: string;
};

export function AdminPlaceholderPage({
  description,
  icon: Icon,
  items,
  title,
}: AdminPlaceholderPageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.headerIcon}>
          <Icon aria-hidden size={24} strokeWidth={2.1} />
        </span>
        <div>
          <AdminBadge size="sm" tone="neutral">
            Скоро
          </AdminBadge>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>

      <AdminCard className={styles.card}>
        <AdminCard.Header className={styles.cardHeader}>
          <div>
            <AdminCard.Title>Что будет внутри</AdminCard.Title>
            <AdminCard.Description>
              Базу раздела подготовили, логику добавим следующим шагом.
            </AdminCard.Description>
          </div>
        </AdminCard.Header>
        <AdminCard.Content className={styles.list}>
          {items.map((item) => (
            <div className={styles.item} key={item}>
              <span />
              <p>{item}</p>
            </div>
          ))}
        </AdminCard.Content>
      </AdminCard>
    </div>
  );
}
