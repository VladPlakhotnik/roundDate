"use client";

import { Copy, Mail, Phone, UserRound } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { useToast } from "@/shared/ui/Toast";

import styles from "./OrganizerModal.module.css";

export type EventOrganizer = {
  avatarUrl?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: string;
};

type OrganizerModalProps = {
  eventTitle?: string;
  organizer?: EventOrganizer;
  trigger: ReactNode;
};

export const DEFAULT_EVENT_ORGANIZER = {
  avatarUrl: "/assets/profile/matches/avatar-maria.png",
  email: "hello@speeddate.pl",
  firstName: "Anna",
  lastName: "Kowalska",
  phone: "+48 512 345 678",
  role: "Организатор SpeedDate",
} satisfies EventOrganizer;

export function getOrganizerName(organizer: EventOrganizer) {
  return `${organizer.firstName} ${organizer.lastName}`.trim();
}

function getInitials(organizer: EventOrganizer) {
  return [organizer.firstName, organizer.lastName]
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getPhoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function getEmailHref(email: string, eventTitle: string | undefined) {
  if (!eventTitle) {
    return `mailto:${email}`;
  }

  return `mailto:${email}?subject=${encodeURIComponent(`Вопрос по событию ${eventTitle}`)}`;
}

async function writeClipboardText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const selection = document.getSelection();
    const selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const textarea = document.createElement("textarea");

    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, value.length);

    const copied = document.execCommand("copy");
    textarea.remove();

    if (selection && selectedRange) {
      selection.removeAllRanges();
      selection.addRange(selectedRange);
    }

    if (!copied) {
      throw new Error("Clipboard copy failed.");
    }
  }
}

export function OrganizerModal({
  eventTitle,
  organizer = DEFAULT_EVENT_ORGANIZER,
  trigger,
}: OrganizerModalProps) {
  const toast = useToast();
  const organizerName = getOrganizerName(organizer);
  const emailHref = getEmailHref(organizer.email, eventTitle);
  const phoneHref = getPhoneHref(organizer.phone);

  async function copyContact(value: string, label: "Email" | "Телефон") {
    try {
      await writeClipboardText(value);
      toast.success(`${label} скопирован.`);
    } catch {
      toast.error("Не удалось скопировать.", "Скопируйте контакт вручную.");
    }
  }

  return (
    <Modal size="sm" title="Связаться с организатором" trigger={trigger}>
      <div className={styles.body}>
        <div className={styles.profile}>
          <div className={styles.avatar}>
            {organizer.avatarUrl ? (
              <Image alt="" height={86} src={organizer.avatarUrl} width={86} />
            ) : (
              <span>{getInitials(organizer) || <UserRound aria-hidden size={28} />}</span>
            )}
          </div>
          <div>
            <span className={styles.eyebrow}>Организатор мероприятия</span>
            <h3>{organizerName}</h3>
            {organizer.role ? <p>{organizer.role}</p> : null}
          </div>
        </div>

        <div className={styles.contacts} aria-label="Контакты организатора">
          <div className={styles.contactRow}>
            <a className={styles.contactLink} href={phoneHref}>
              <span className={styles.contactIcon}>
                <Phone aria-hidden size={20} />
              </span>
              <span>
                <small>Телефон</small>
                <strong>{organizer.phone}</strong>
              </span>
            </a>
            <button
              aria-label="Скопировать телефон"
              className={styles.copyButton}
              onClick={() => copyContact(organizer.phone, "Телефон")}
              type="button"
            >
              <Copy aria-hidden size={18} />
            </button>
          </div>

          <div className={styles.contactRow}>
            <a className={styles.contactLink} href={emailHref}>
              <span className={styles.contactIcon}>
                <Mail aria-hidden size={20} />
              </span>
              <span>
                <small>Email</small>
                <strong>{organizer.email}</strong>
              </span>
            </a>
            <button
              aria-label="Скопировать email"
              className={styles.copyButton}
              onClick={() => copyContact(organizer.email, "Email")}
              type="button"
            >
              <Copy aria-hidden size={18} />
            </button>
          </div>
        </div>

        <div className={styles.actions}>
          <Button as="link" fullWidth href={emailHref} leftIcon={<Mail aria-hidden size={18} />}>
            Написать письмо
          </Button>
          <Button
            as="link"
            fullWidth
            href={phoneHref}
            leftIcon={<Phone aria-hidden size={18} />}
            variant="outline"
          >
            Позвонить
          </Button>
        </div>
      </div>
    </Modal>
  );
}
