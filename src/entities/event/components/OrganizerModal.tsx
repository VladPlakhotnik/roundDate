"use client";

import { Copy, Mail, Phone, UserRound } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { contactEmail } from "@/shared/config/contact";
import { useI18n } from "@/shared/i18n/I18nProvider";
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
  email: contactEmail,
  firstName: "Anna",
  lastName: "Kowalska",
  phone: "+48 512 345 678",
  role: "RoundDate",
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

function getEmailHref(email: string, eventTitle: string | undefined, subject: string) {
  if (!eventTitle) {
    return `mailto:${email}`;
  }

  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
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
  const { t } = useI18n();
  const toast = useToast();
  const organizerName = getOrganizerName(organizer);
  const emailHref = getEmailHref(
    organizer.email,
    eventTitle,
    t("event.organizer.emailSubject", { title: eventTitle ?? "RoundDate" }),
  );
  const phoneHref = getPhoneHref(organizer.phone);

  async function copyContact(value: string, label: string) {
    try {
      await writeClipboardText(value);
      toast.success(t("event.organizer.copied", { label }));
    } catch {
      toast.error(t("event.organizer.copyError"), t("event.organizer.copyErrorDescription"));
    }
  }

  return (
    <Modal layer="nested" size="sm" title={t("event.organizer.title")} trigger={trigger}>
      <div
        className={styles.body}
        data-mobile-layout="compact-contact"
        data-testid="organizer-contact-body"
      >
        <div
          className={styles.profile}
          data-mobile-density="compact"
          data-testid="organizer-contact-profile"
        >
          <div className={styles.avatar}>
            {organizer.avatarUrl ? (
              <Image alt="" height={86} src={organizer.avatarUrl} width={86} />
            ) : (
              <span>{getInitials(organizer) || <UserRound aria-hidden size={28} />}</span>
            )}
          </div>
          <div>
            <span className={styles.eyebrow}>{t("event.organizer.heading")}</span>
            <h3>{organizerName}</h3>
            <p>{organizer.role ?? t("event.organizer.defaultRole")}</p>
          </div>
        </div>

        <div className={styles.contacts} aria-label={t("event.organizer.heading")}>
          <div className={styles.contactRow}>
            <a className={styles.contactLink} href={phoneHref}>
              <span className={styles.contactIcon}>
                <Phone aria-hidden size={20} />
              </span>
              <span>
                <small>{t("common.form.phone")}</small>
                <strong>{organizer.phone}</strong>
              </span>
            </a>
            <button
              aria-label={t("common.actions.copyPhone")}
              className={styles.copyButton}
              onClick={() => copyContact(organizer.phone, t("common.form.phone"))}
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
              aria-label={t("common.actions.copyEmail")}
              className={styles.copyButton}
              onClick={() => copyContact(organizer.email, "Email")}
              type="button"
            >
              <Copy aria-hidden size={18} />
            </button>
          </div>
        </div>

        <div
          className={styles.actions}
          data-mobile-sticky="actions"
          data-testid="organizer-contact-actions"
        >
          <Button as="link" fullWidth href={emailHref} leftIcon={<Mail aria-hidden size={18} />}>
            {t("event.organizer.mail")}
          </Button>
          <Button
            as="link"
            fullWidth
            href={phoneHref}
            leftIcon={<Phone aria-hidden size={18} />}
            variant="outline"
          >
            {t("event.organizer.phone")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
