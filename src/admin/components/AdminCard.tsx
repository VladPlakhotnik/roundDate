import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import styles from "./AdminCard.module.css";

type AdminCardRootProps<T extends ElementType = "div"> = {
  as?: T;
  children: ReactNode;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

function AdminCardRoot<T extends ElementType = "div">({
  as,
  children,
  className,
  ...props
}: AdminCardRootProps<T>) {
  const Component = as ?? "div";

  return (
    <Component className={cn(styles.root, className)} {...props}>
      {children}
    </Component>
  );
}

type AdminCardPartProps<T extends ElementType> = Omit<ComponentPropsWithoutRef<T>, "className"> & {
  className?: string | undefined;
};

function AdminCardHeader({ children, className, ...props }: AdminCardPartProps<"div">) {
  return (
    <div className={cn(styles.header, className)} {...props}>
      {children}
    </div>
  );
}

function AdminCardContent({ children, className, ...props }: AdminCardPartProps<"div">) {
  return (
    <div className={cn(styles.content, className)} {...props}>
      {children}
    </div>
  );
}

function AdminCardTitle({ children, className, ...props }: AdminCardPartProps<"h3">) {
  return (
    <h3 className={cn(styles.title, className)} {...props}>
      {children}
    </h3>
  );
}

function AdminCardDescription({ children, className, ...props }: AdminCardPartProps<"p">) {
  return (
    <p className={cn(styles.description, className)} {...props}>
      {children}
    </p>
  );
}

export const AdminCard = Object.assign(AdminCardRoot, {
  Content: AdminCardContent,
  Description: AdminCardDescription,
  Header: AdminCardHeader,
  Title: AdminCardTitle,
});
