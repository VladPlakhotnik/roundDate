import type { InputHTMLAttributes, ReactNode } from "react";

export type InputSize = "sm" | "md" | "lg" | "xl";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  controlClassName?: string | undefined;
  error?: ReactNode;
  fieldClassName?: string | undefined;
  hint?: ReactNode;
  inputClassName?: string | undefined;
  label?: ReactNode;
  labelAction?: ReactNode;
  labelClassName?: string | undefined;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: InputSize;
};
