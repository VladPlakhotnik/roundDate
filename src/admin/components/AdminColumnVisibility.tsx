"use client";

import { Check, Columns3 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useFloatingPopover } from "@/shared/hooks/useFloatingPopover";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";

import styles from "./AdminColumnVisibility.module.css";

export type AdminColumnVisibilityOption = {
  id: string;
  label: string;
};

type AdminColumnVisibilityProps = {
  className?: string;
  columns: readonly AdminColumnVisibilityOption[];
  onVisibleColumnIdsChange: (ids: string[]) => void;
  storageKey?: string;
  visibleColumnIds: string[];
};

export function AdminColumnVisibility({
  className,
  columns,
  onVisibleColumnIdsChange,
  storageKey,
  visibleColumnIds,
}: AdminColumnVisibilityProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const onVisibleColumnIdsChangeRef = useRef(onVisibleColumnIdsChange);
  const didSkipInitialPersistRef = useRef(false);
  const columnIds = useMemo(() => columns.map((column) => column.id), [columns]);
  const visibleColumnSet = new Set(visibleColumnIds);
  const popoverStyle = useFloatingPopover(open, triggerRef, {
    estimatedHeight: Math.min(360, columns.length * 40 + 16),
    minWidth: 220,
    preferredWidth: 220,
  });

  useEffect(() => {
    onVisibleColumnIdsChangeRef.current = onVisibleColumnIdsChange;
  }, [onVisibleColumnIdsChange]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") {
      return;
    }

    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return;
    }

    try {
      const storedColumnIds = JSON.parse(storedValue);

      if (!Array.isArray(storedColumnIds)) {
        return;
      }

      const nextVisibleColumnIds = columnIds.filter((columnId) =>
        storedColumnIds.includes(columnId),
      );

      if (nextVisibleColumnIds.length > 0) {
        onVisibleColumnIdsChangeRef.current(nextVisibleColumnIds);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [columnIds, storageKey]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") {
      return;
    }

    if (!didSkipInitialPersistRef.current) {
      didSkipInitialPersistRef.current = true;
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify(columnIds.filter((columnId) => visibleColumnIds.includes(columnId))),
    );
  }, [columnIds, storageKey, visibleColumnIds]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggleColumn(columnId: string) {
    const isVisible = visibleColumnSet.has(columnId);

    if (isVisible && visibleColumnIds.length <= 1) {
      return;
    }

    const nextVisibleColumnSet = new Set(visibleColumnIds);

    if (isVisible) {
      nextVisibleColumnSet.delete(columnId);
    } else {
      nextVisibleColumnSet.add(columnId);
    }

    onVisibleColumnIdsChange(
      columns.map((column) => column.id).filter((column) => nextVisibleColumnSet.has(column)),
    );
  }

  const popover =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            className={styles.popover}
            role="menu"
            style={popoverStyle ?? { visibility: "hidden" }}
          >
            {columns.map((column) => {
              const isChecked = visibleColumnSet.has(column.id);
              const isLastVisibleColumn = isChecked && visibleColumnIds.length <= 1;

              return (
                <label className={styles.option} key={column.id}>
                  <input
                    checked={isChecked}
                    disabled={isLastVisibleColumn}
                    type="checkbox"
                    onChange={() => toggleColumn(column.id)}
                  />
                  <span className={styles.checkbox} aria-hidden>
                    {isChecked ? <Check size={13} strokeWidth={3} /> : null}
                  </span>
                  <span>{column.label}</span>
                </label>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={cn(styles.root, className)}>
      <Button
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="menu"
        className={styles.trigger}
        leftIcon={<Columns3 aria-hidden size={16} />}
        size="sm"
        variant="outline"
        onClick={() => setOpen((current) => !current)}
      >
        Колонки
      </Button>

      {popover}
    </div>
  );
}
