"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Button } from "@/shared/ui/Button";

import styles from "./LoadMore.module.css";

type LoadMoreProps<TItem> = {
  children: (items: TItem[]) => ReactNode;
  initialCount?: number;
  increment?: number;
  items: readonly TItem[];
  label: string;
  loadingDurationMs?: number;
  loadingLabel?: string;
  resetKey?: string | number;
};

export function LoadMore<TItem>({ initialCount = 4, resetKey, ...props }: LoadMoreProps<TItem>) {
  return (
    <LoadMoreState
      key={`load-more-${resetKey ?? "default"}-${initialCount}`}
      initialCount={initialCount}
      {...props}
    />
  );
}

function LoadMoreState<TItem>({
  children,
  initialCount,
  increment,
  items,
  label,
  loadingDurationMs = 480,
  loadingLabel = "Загружаем",
}: Omit<LoadMoreProps<TItem>, "resetKey"> & { initialCount: number }) {
  const safeInitialCount = Math.max(0, initialCount);
  const safeIncrement = Math.max(1, (increment ?? safeInitialCount) || 1);
  const [visibleCount, setVisibleCount] = useState(safeInitialCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        window.clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, []);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const canLoadMore = visibleCount < items.length;

  function loadMore() {
    if (!canLoadMore || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    loadingTimerRef.current = window.setTimeout(() => {
      setVisibleCount((current) => Math.min(current + safeIncrement, items.length));
      setIsLoadingMore(false);
      loadingTimerRef.current = null;
    }, loadingDurationMs);
  }

  return (
    <>
      {children(visibleItems)}

      {canLoadMore || isLoadingMore ? (
        <div className={styles.row}>
          <Button
            disabled={isLoadingMore}
            leftIcon={
              isLoadingMore ? (
                <span className={styles.loadingWave} aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
              ) : undefined
            }
            rightIcon={!isLoadingMore ? <ChevronDown aria-hidden size={17} /> : undefined}
            size="md"
            variant="outline"
            onClick={loadMore}
          >
            {isLoadingMore ? loadingLabel : label}
          </Button>
        </div>
      ) : null}
    </>
  );
}
