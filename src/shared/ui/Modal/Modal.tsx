"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import styles from "./Modal.module.css";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export type ModalProps = {
  children: ReactNode;
  className?: string | undefined;
  contentClassName?: string | undefined;
  defaultOpen?: boolean;
  description?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  overlayClassName?: string | undefined;
  showCloseButton?: boolean;
  size?: ModalSize;
  title?: ReactNode;
  trigger?: ReactNode;
  visuallyHiddenTitle?: boolean;
};

const sizeClassName: Record<ModalSize, string | undefined> = {
  lg: styles.contentLg,
  md: styles.contentMd,
  sm: styles.contentSm,
  xl: styles.contentXl,
};

export function Modal({
  children,
  className,
  contentClassName,
  defaultOpen,
  description,
  onOpenChange,
  open,
  overlayClassName,
  showCloseButton = true,
  size = "md",
  title,
  trigger,
  visuallyHiddenTitle,
}: ModalProps) {
  return (
    <Dialog.Root
      {...(defaultOpen !== undefined ? { defaultOpen } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
      {...(open !== undefined ? { open } : {})}
    >
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className={cn(styles.overlay, overlayClassName)} />
        <Dialog.Content className={cn(styles.content, sizeClassName[size], contentClassName)}>
          {title ? (
            <Dialog.Title className={cn(styles.title, visuallyHiddenTitle && styles.titleSrOnly)}>
              {title}
            </Dialog.Title>
          ) : null}
          {description ? (
            <Dialog.Description className={styles.description}>{description}</Dialog.Description>
          ) : null}
          {showCloseButton ? (
            <Dialog.Close className={styles.close} aria-label="Закрыть окно">
              <X aria-hidden size={18} />
            </Dialog.Close>
          ) : null}
          <div className={cn(styles.body, className)}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const ModalClose = Dialog.Close;
