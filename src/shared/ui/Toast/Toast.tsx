"use client";

import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import styles from "./Toast.module.css";

export type ToastType = "error" | "info" | "success" | "warning";

export type ToastInput = {
  description?: string;
  duration?: number;
  title: string;
  type: ToastType;
};

type ToastItem = ToastInput & {
  id: string;
};

type ToastContextValue = {
  dismiss: (id: string) => void;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  show: (input: ToastInput) => string;
  success: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const iconByType = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
} satisfies Record<ToastType, typeof CheckCircle2>;

function createToastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createToastInput(type: ToastType, title: string, description?: string): ToastInput {
  return description ? { description, title, type } : { title, type };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);

    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (input: ToastInput) => {
      const id = createToastId();
      const duration = input.duration ?? 4200;
      const toast: ToastItem = { ...input, duration, id };

      setToasts((current) => [toast, ...current].slice(0, 4));

      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;

    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      dismiss,
      error: (title, description) => show(createToastInput("error", title, description)),
      info: (title, description) => show(createToastInput("info", title, description)),
      show,
      success: (title, description) => show(createToastInput("success", title, description)),
      warning: (title, description) => show(createToastInput("warning", title, description)),
    }),
    [dismiss, show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-label="Уведомления" className={styles.viewport}>
        {toasts.map((toast) => {
          const Icon = iconByType[toast.type];

          return (
            <article
              className={styles.toast}
              data-has-description={Boolean(toast.description)}
              data-type={toast.type}
              key={toast.id}
              role={toast.type === "error" ? "alert" : "status"}
            >
              <span className={styles.icon}>
                <Icon aria-hidden size={20} strokeWidth={2.2} />
              </span>
              <div className={styles.content}>
                <p className={styles.title}>{toast.title}</p>
                {toast.description ? (
                  <p className={styles.description}>{toast.description}</p>
                ) : null}
              </div>
              <button
                aria-label="Закрыть уведомление"
                className={styles.close}
                onClick={() => dismiss(toast.id)}
                type="button"
              >
                <X aria-hidden size={17} strokeWidth={2.2} />
              </button>
            </article>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
