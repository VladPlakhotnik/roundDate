"use client";

import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { getBookingCancellationState } from "@/entities/events/model/user-payments";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Button, type ButtonSize } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { useToast } from "@/shared/ui/Toast";

import styles from "./ProfileView.module.css";

type CancelBookingButtonProps = {
  bookingId: string;
  eventTitle: string;
  size?: ButtonSize;
  startsAt: string;
};

const deadlineFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "long",
  timeZone: "Europe/Warsaw",
});

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };

    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function CancelBookingButton({
  bookingId,
  eventTitle,
  size = "sm",
  startsAt,
}: CancelBookingButtonProps) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellationCheckedAt, setCancellationCheckedAt] = useState(() => new Date());
  const cancellationState = useMemo(
    () =>
      getBookingCancellationState({
        now: cancellationCheckedAt,
        startsAt: new Date(startsAt),
      }),
    [cancellationCheckedAt, startsAt],
  );
  const deadlineLabel = deadlineFormatter.format(cancellationState.deadlineAt);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setCancellationCheckedAt(new Date());
    }

    setOpen(nextOpen);
  }

  async function cancelBooking() {
    const checkedAt = new Date();
    const latestCancellationState = getBookingCancellationState({
      now: checkedAt,
      startsAt: new Date(startsAt),
    });

    setCancellationCheckedAt(checkedAt);

    if (!latestCancellationState.canCancel) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/profile/bookings/${encodeURIComponent(bookingId)}/cancel`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error(await readError(response, t("profile.bookings.cancel.fallbackError")));
      }

      const result = (await response.json()) as { refunded?: boolean };

      setOpen(false);
      toast.success(
        t("profile.bookings.cancel.success"),
        result.refunded
          ? t("profile.bookings.cancel.refunded")
          : t("profile.bookings.cancel.removed"),
      );
      router.refresh();
    } catch (error) {
      toast.error(
        t("profile.bookings.cancel.error"),
        error instanceof Error ? error.message : t("profile.bookings.cancel.errorDescription"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      className={styles.bookingCancelModal}
      open={open}
      size="sm"
      title={t("profile.bookings.cancel.title")}
      trigger={
        <Button leftIcon={<X aria-hidden size={16} />} size={size} variant="outline">
          {t("profile.bookings.cancel.title")}
        </Button>
      }
      onOpenChange={handleOpenChange}
    >
      <div className={styles.bookingCancelContent}>
        <div
          className={styles.bookingCancelNotice}
          data-state={cancellationState.canCancel ? "ok" : "blocked"}
        >
          <AlertTriangle aria-hidden size={20} />
          <div>
            <h3>
              {cancellationState.canCancel
                ? t("profile.bookings.cancel.available")
                : t("profile.bookings.cancel.blocked")}
            </h3>
            <p>{t("profile.bookings.cancel.deadline", { deadline: deadlineLabel })}</p>
          </div>
        </div>

        <div className={styles.bookingCancelSummary}>
          <span>{t("profile.bookings.cancel.event")}</span>
          <strong>{eventTitle}</strong>
        </div>

        <p className={styles.bookingCancelText}>{t("profile.bookings.cancel.refundInfo")}</p>

        <div className={styles.bookingCancelActions}>
          <Button disabled={isSubmitting} variant="outline" onClick={() => setOpen(false)}>
            {t("profile.bookings.cancel.keep")}
          </Button>
          <Button
            disabled={!cancellationState.canCancel}
            isLoading={isSubmitting}
            leftIcon={<RotateCcw aria-hidden size={17} />}
            onClick={cancelBooking}
          >
            {t("profile.bookings.cancel.confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
