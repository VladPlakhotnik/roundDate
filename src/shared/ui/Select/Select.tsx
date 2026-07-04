"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { useI18n } from "@/shared/i18n/I18nProvider";
import { cn } from "@/shared/lib/cn";
import { useFloatingPopover } from "@/shared/hooks/useFloatingPopover";

import styles from "./Select.module.css";

export type SelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

export type SelectSize = "sm" | "md" | "lg" | "xl";
export type SelectVariant = "default" | "filter";

export type SelectProps = {
  className?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  label?: string;
  leftIcon?: ReactNode;
  name?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  size?: SelectSize;
  triggerClassName?: string;
  value?: string;
  variant?: SelectVariant;
};

const triggerSizeClassName = {
  sm: styles.triggerSm,
  md: styles.triggerMd,
  lg: styles.triggerLg,
  xl: styles.triggerXl,
} satisfies Record<SelectSize, string | undefined>;

export function Select({
  className,
  disabled,
  error,
  id,
  label,
  leftIcon,
  name,
  onChange,
  options,
  placeholder,
  required,
  size = "md",
  triggerClassName,
  value,
  variant = "default",
}: SelectProps) {
  const { t } = useI18n();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;
  const labelId = label ? `${inputId}-label` : undefined;
  const valueId = `${inputId}-value`;
  const errorId = error ? `${inputId}-error` : undefined;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [modalPopoverRoot, setModalPopoverRoot] = useState<HTMLElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);
  const resolvedPlaceholder = placeholder ?? t("common.ui.selectPlaceholder");
  const portalContainer =
    modalPopoverRoot ?? (typeof document !== "undefined" ? document.body : null);
  const popoverStyle = useFloatingPopover(open, triggerRef, {
    container: modalPopoverRoot,
    estimatedHeight: Math.min(320, options.length * 50 + 16),
    matchTriggerWidth: true,
    minWidth: 220,
    strategy: modalPopoverRoot ? "absolute" : "fixed",
  });

  function getFirstEnabledIndex() {
    return options.findIndex((option) => !option.disabled);
  }

  function getLastEnabledIndex() {
    for (let index = options.length - 1; index >= 0; index -= 1) {
      if (!options[index]?.disabled) {
        return index;
      }
    }

    return -1;
  }

  function getInitialActiveIndex() {
    const selectedIndex = options.findIndex((option) => option.value === value && !option.disabled);

    return selectedIndex >= 0 ? selectedIndex : getFirstEnabledIndex();
  }

  function openListbox() {
    setModalPopoverRoot(
      rootRef.current?.closest("[data-floating-popover-root]") as HTMLElement | null,
    );
    setActiveIndex(getInitialActiveIndex());
    setOpen(true);
  }

  function closeListbox() {
    setOpen(false);
  }

  function toggleListbox() {
    if (open) {
      closeListbox();
      return;
    }

    openListbox();
  }

  function moveActiveIndex(direction: 1 | -1) {
    if (!options.length) {
      setActiveIndex(-1);
      return;
    }

    const startIndex = activeIndex >= 0 ? activeIndex : getInitialActiveIndex();

    for (let offset = 1; offset <= options.length; offset += 1) {
      const nextIndex = (startIndex + direction * offset + options.length) % options.length;

      if (!options[nextIndex]?.disabled) {
        setActiveIndex(nextIndex);
        return;
      }
    }
  }

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

  function selectValue(nextValue: string) {
    onChange?.(nextValue);
    closeListbox();
  }

  function selectActiveValue() {
    const option = options[activeIndex];

    if (!option || option.disabled) {
      return;
    }

    selectValue(option.value);
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!open) {
        openListbox();
        return;
      }

      moveActiveIndex(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        openListbox();
        return;
      }

      moveActiveIndex(-1);
      return;
    }

    if (event.key === "Home" && open) {
      event.preventDefault();
      setActiveIndex(getFirstEnabledIndex());
      return;
    }

    if (event.key === "End" && open) {
      event.preventDefault();
      setActiveIndex(getLastEnabledIndex());
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (!open) {
        openListbox();
        return;
      }

      selectActiveValue();
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      closeListbox();
    }
  }

  const listbox =
    open && portalContainer
      ? createPortal(
          <div
            ref={popoverRef}
            className={styles.popover}
            id={listboxId}
            role="listbox"
            style={popoverStyle ?? { visibility: "hidden" }}
          >
            {options.map((option, index) => {
              const selected = option.value === value;

              return (
                <button
                  aria-selected={selected}
                  className={cn(
                    styles.option,
                    index === activeIndex && styles.optionActive,
                    selected && styles.optionSelected,
                  )}
                  disabled={option.disabled}
                  id={`${listboxId}-${option.value}`}
                  key={option.value}
                  role="option"
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectValue(option.value)}
                >
                  <span>{option.label}</span>
                  {selected ? <Check aria-hidden size={18} strokeWidth={2.3} /> : null}
                </button>
              );
            })}
          </div>,
          portalContainer,
        )
      : null;

  return (
    <div ref={rootRef} className={cn(styles.field, error && styles.invalid, className)}>
      {label ? (
        <label className={styles.label} htmlFor={inputId} id={labelId}>
          {label}
        </label>
      ) : null}

      <input
        tabIndex={-1}
        aria-hidden
        className={styles.hiddenInput}
        id={inputId}
        name={name}
        required={required}
        value={value ?? ""}
        onChange={() => undefined}
      />

      <button
        ref={triggerRef}
        aria-controls={listboxId}
        aria-describedby={errorId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId ? `${labelId} ${valueId}` : valueId}
        className={cn(
          styles.trigger,
          triggerSizeClassName[size],
          variant === "filter" && styles.triggerFilter,
          leftIcon && styles.hasLeftIcon,
          triggerClassName,
        )}
        data-variant={variant}
        disabled={disabled}
        type="button"
        onKeyDown={handleTriggerKeyDown}
        onClick={toggleListbox}
      >
        {leftIcon ? <span className={styles.leadingIcon}>{leftIcon}</span> : null}
        <span className={cn(styles.value, !selectedOption && styles.placeholder)} id={valueId}>
          {selectedOption?.label ?? resolvedPlaceholder}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(styles.chevron, open && styles.chevronOpen)}
          size={20}
          strokeWidth={2.1}
        />
      </button>

      {listbox}

      {error ? (
        <span className={styles.error} id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
