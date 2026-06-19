"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coffee,
  CreditCard,
  Heart,
  Hourglass,
  IdCard,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Shirt,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { Badge, type BadgeStatus } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Modal, ModalClose } from "@/shared/ui/Modal";

import { EventDetailsMap } from "./EventDetailsMap";
import type { EventMapLocation } from "./EventDetailsMap";
import {
  DEFAULT_EVENT_ORGANIZER,
  getOrganizerName,
  OrganizerModal,
  type EventOrganizer,
} from "./OrganizerModal";
import styles from "./EventDetailsModal.module.css";

export type EventDetailsModalContext = "available" | "booking" | "past";

export type EventDetailsModalEvent = {
  ageRange: string;
  capacityTotal: number;
  city: string;
  conversationMinutes: number;
  dateLabel: string;
  description: string;
  durationMinutes: number;
  highlights: string[];
  id: string;
  language: string;
  locationLabel: string;
  mapLocation: EventMapLocation;
  organizer?: EventOrganizer;
  priceLabel: string;
  spotsAvailable: number;
  startsAt: string;
  statusLabel: string;
  timeLabel: string;
  title: string;
  venueAddress: string;
  venueName: string;
  weekdayLabel: string;
};

type EventDetailsModalProps = {
  context?: EventDetailsModalContext;
  event: EventDetailsModalEvent;
  status?: BadgeStatus;
  trigger: ReactNode;
};

const importantItems = [
  {
    icon: IdCard,
    text: "Возьмите документ, удостоверяющий личность",
  },
  {
    icon: Shirt,
    text: "Дресс-код Smart Casual",
  },
  {
    icon: Clock3,
    text: "Опоздания не гарантируют полного участия",
  },
  {
    icon: ShieldCheck,
    text: "Возврат возможен не позднее чем за 24 часа",
  },
];

function formatEventDate(event: EventDetailsModalEvent) {
  const startsAt = new Date(event.startsAt);
  const date = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Warsaw",
    year: "numeric",
  }).format(startsAt);

  return `${date}, ${event.weekdayLabel.toLowerCase()}`;
}

function formatTime(startsAt: Date, offsetMinutes = 0) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(new Date(startsAt.getTime() + offsetMinutes * 60_000));
}

function getSchedule(event: EventDetailsModalEvent) {
  const startsAt = new Date(event.startsAt);
  const finalOffset = Math.max(event.durationMinutes, 110);

  return [
    { label: "Сбор гостей", time: formatTime(startsAt, -30) },
    { label: "Знакомства", time: formatTime(startsAt) },
    { label: "Кофе-брейк", time: formatTime(startsAt, Math.round(finalOffset * 0.55)) },
    { label: "Продолжение", time: formatTime(startsAt, Math.round(finalOffset * 0.72)) },
    { label: "Финал вечера", time: formatTime(startsAt, finalOffset) },
  ];
}

function getAudienceCopy(event: EventDetailsModalEvent) {
  return `Мужчинам и женщинам от ${event.ageRange.replace("-", " до ")} лет, которые хотят познакомиться для серьезных отношений в комфортной и уважительной атмосфере.`;
}

function getPrimaryAction(context: EventDetailsModalContext, status: BadgeStatus | undefined) {
  if (context === "past") {
    return {
      disabled: true,
      icon: CheckCircle2,
      label: "Событие завершено",
      variant: "secondary" as const,
    };
  }

  if (context === "available") {
    return {
      disabled: false,
      icon: Heart,
      label: "Записаться",
      variant: "primary" as const,
    };
  }

  if (status === "payment-pending") {
    return {
      disabled: false,
      icon: CreditCard,
      label: "Оплатить участие",
      variant: "primary" as const,
    };
  }

  if (status === "waitlist") {
    return {
      disabled: true,
      icon: Hourglass,
      label: "В листе ожидания",
      variant: "secondary" as const,
    };
  }

  return {
    disabled: true,
    icon: CheckCircle2,
    label: "Запись подтверждена",
    variant: "secondary" as const,
  };
}

function getSummaryBadge(event: EventDetailsModalEvent) {
  if (event.statusLabel.toLowerCase().includes("нет")) {
    return { label: "Мест нет", tone: "neutral" as const };
  }

  return { label: "Места есть", tone: "success" as const };
}

export function EventDetailsModal({
  context = "available",
  event,
  status,
  trigger,
}: EventDetailsModalProps) {
  const schedule = getSchedule(event);
  const primaryAction = getPrimaryAction(context, status);
  const PrimaryIcon = primaryAction.icon;
  const summaryBadge = getSummaryBadge(event);
  const organizer = event.organizer ?? DEFAULT_EVENT_ORGANIZER;
  const organizerName = getOrganizerName(organizer);

  return (
    <Modal
      className={styles.modalBody}
      contentClassName={styles.modalContent}
      showCloseButton
      size="xl"
      title={`Детали мероприятия ${event.title}`}
      trigger={trigger}
      visuallyHiddenTitle
    >
      <div className={styles.shell}>
        <EventDetailsMap location={event.mapLocation} />

        <div className={styles.bodyGrid}>
          <div className={styles.mainColumn}>
            <section className={styles.infoBlock}>
              <span className={styles.sectionIcon}>
                <Heart aria-hidden size={26} />
              </span>
              <div>
                <h2>О событии</h2>
                <p>{event.description}</p>
                <p>
                  Легкое общение, искренние эмоции и шанс встретить того самого человека офлайн.
                </p>
              </div>
            </section>

            <section className={styles.infoBlock}>
              <span className={styles.sectionIcon}>
                <UsersRound aria-hidden size={26} />
              </span>
              <div>
                <h2>Кому подходит</h2>
                <p>{getAudienceCopy(event)}</p>
              </div>
            </section>

            <section className={styles.programBlock}>
              <span className={styles.sectionIcon}>
                <Coffee aria-hidden size={26} />
              </span>
              <div>
                <h2>Программа вечера</h2>
                <div className={styles.timeline}>
                  {schedule.map((item) => (
                    <div className={styles.timelineItem} key={`${item.time}-${item.label}`}>
                      <span className={styles.timelineDot} />
                      <strong>{item.time}</strong>
                      <small>{item.label}</small>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className={styles.importantBlock}>
              <span className={styles.sectionIcon}>
                <ShieldCheck aria-hidden size={26} />
              </span>
              <div>
                <h2>Важно знать</h2>
                <div className={styles.importantGrid}>
                  {importantItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div className={styles.importantItem} key={item.text}>
                        <Icon aria-hidden size={21} />
                        <span>{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          <aside className={styles.summaryCard} aria-label="Краткая информация о мероприятии">
            <div className={styles.summaryHeader}>
              <h2>{event.title}</h2>
              <Sparkles aria-hidden size={28} />
            </div>

            <div className={styles.summaryList}>
              <div>
                <CalendarDays aria-hidden size={22} />
                <span>{formatEventDate(event)}</span>
              </div>
              <div>
                <Clock3 aria-hidden size={22} />
                <span>
                  {event.timeLabel} – {formatTime(new Date(event.startsAt), event.durationMinutes)}
                </span>
              </div>
              <div>
                <MapPin aria-hidden size={22} />
                <span>
                  <strong>{event.venueName}</strong>
                  {event.venueAddress}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${event.venueName}, ${event.city}, ${event.venueAddress}`,
                    )}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Как добраться?
                  </a>
                </span>
              </div>
            </div>

            <div className={styles.statusStack}>
              <Badge tone={summaryBadge.tone}>{summaryBadge.label}</Badge>
              {context === "booking" && status ? <Badge status={status} /> : null}
            </div>

            <div className={styles.spotsLine}>
              <UsersRound aria-hidden size={22} />
              <span>
                Осталось мест: <strong>{event.spotsAvailable}</strong> из {event.capacityTotal}
              </span>
            </div>

            <div className={styles.priceBlock}>
              <CreditCard aria-hidden size={22} />
              <span>
                Стоимость участия
                <strong>{event.priceLabel}</strong>
                <small>Включен welcome drink</small>
              </span>
            </div>

            <div className={styles.organizerCard}>
              <div className={styles.organizerAvatar} aria-hidden>
                {organizer.firstName[0]}
              </div>
              <div>
                <small>Организатор</small>
                <strong>{organizerName}</strong>
                <span>Организатор SpeedDate</span>
                <a href={`tel:${organizer.phone.replace(/[^\d+]/g, "")}`}>
                  <Phone aria-hidden size={15} />
                  {organizer.phone}
                </a>
              </div>
            </div>
          </aside>
        </div>

        <div className={styles.footerBar}>
          <footer className={styles.footerActions}>
            <ModalClose asChild>
              <Button leftIcon={<X aria-hidden size={18} />} size="lg" variant="outline">
                Закрыть
              </Button>
            </ModalClose>
            <OrganizerModal
              eventTitle={event.title}
              organizer={organizer}
              trigger={
                <Button
                  leftIcon={<MessageCircle aria-hidden size={20} />}
                  size="lg"
                  variant="outline"
                >
                  Связаться с организатором
                </Button>
              }
            />
            <Button
              className={cn(primaryAction.disabled && styles.disabledAction)}
              disabled={primaryAction.disabled}
              leftIcon={<PrimaryIcon aria-hidden size={22} />}
              size="lg"
              variant={primaryAction.variant}
            >
              {primaryAction.label}
            </Button>
          </footer>

          <p className={styles.securityNote}>
            <Lock aria-hidden size={16} />
            Ваши данные под защитой
          </p>
        </div>
      </div>
    </Modal>
  );
}
