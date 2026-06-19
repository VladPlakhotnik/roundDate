import { cva } from "class-variance-authority";

import styles from "./Button.module.css";

export const buttonVariants = cva(styles.root, {
  variants: {
    variant: {
      primary: styles.primary,
      secondary: styles.secondary,
      outline: styles.outline,
      ghost: styles.ghost,
      soft: styles.soft,
      link: styles.link,
    },
    size: {
      sm: styles.sm,
      md: styles.md,
      lg: styles.lg,
      hero: styles.hero,
      icon: styles.icon,
    },
    fullWidth: {
      true: styles.fullWidth,
      false: null,
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    fullWidth: false,
  },
});
