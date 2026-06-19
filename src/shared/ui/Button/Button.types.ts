import type { VariantProps } from "class-variance-authority";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import type { buttonVariants } from "./Button.styles";

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

type ButtonSharedProps = VariantProps<typeof buttonVariants> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
};

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> & {
  as?: "button";
  asChild?: boolean;
  href?: never;
};

type AnchorButtonProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color"> & {
  as: "link";
  asChild?: never;
  disabled?: boolean;
  href: string;
  type?: never;
};

export type ButtonProps = ButtonSharedProps & (NativeButtonProps | AnchorButtonProps);
