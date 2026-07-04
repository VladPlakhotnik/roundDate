"use client";

import { useEffect, useState } from "react";

export function useDebounce<TValue>(value: TValue, delayMs = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [delayMs, value]);

  return debouncedValue;
}
