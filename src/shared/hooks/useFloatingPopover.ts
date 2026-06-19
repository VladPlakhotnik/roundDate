"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

export type FloatingPopoverOptions = {
  estimatedHeight?: number;
  gap?: number;
  matchTriggerWidth?: boolean;
  maxWidth?: number;
  minWidth?: number;
  preferredWidth?: number;
  viewportPadding?: number;
};

export type FloatingPopoverStyle = Pick<
  CSSProperties,
  "bottom" | "left" | "maxHeight" | "top" | "width"
>;

export function useFloatingPopover(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  options: FloatingPopoverOptions = {},
) {
  const {
    estimatedHeight = 280,
    gap = 10,
    matchTriggerWidth = false,
    maxWidth,
    minWidth,
    preferredWidth,
    viewportPadding = 12,
  } = options;
  const [style, setStyle] = useState<FloatingPopoverStyle | null>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger || typeof window === "undefined") {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const availableWidth = window.innerWidth - viewportPadding * 2;
    const targetWidth = matchTriggerWidth ? rect.width : (preferredWidth ?? rect.width);
    const resolvedMinWidth =
      minWidth ?? (matchTriggerWidth ? rect.width : Math.min(rect.width, targetWidth));
    const resolvedMaxWidth = maxWidth ?? availableWidth;
    const width = Math.min(
      Math.max(targetWidth, resolvedMinWidth),
      resolvedMaxWidth,
      availableWidth,
    );
    const viewportRight = window.innerWidth - viewportPadding;
    const triggerCenter = rect.left + rect.width / 2;
    const centeredLeft = triggerCenter - width / 2;
    const left = Math.max(viewportPadding, Math.min(centeredLeft, viewportRight - width));
    const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
    const spaceAbove = rect.top - gap - viewportPadding;
    const openAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      120,
      Math.min(estimatedHeight, Math.floor(openAbove ? spaceAbove : spaceBelow)),
    );

    setStyle({
      left: Math.round(left),
      maxHeight,
      width: Math.round(width),
      ...(openAbove
        ? { bottom: Math.round(window.innerHeight - rect.top + gap) }
        : { top: Math.round(rect.bottom + gap) }),
    });
  }, [
    estimatedHeight,
    gap,
    matchTriggerWidth,
    maxWidth,
    minWidth,
    preferredWidth,
    triggerRef,
    viewportPadding,
  ]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return style;
}
