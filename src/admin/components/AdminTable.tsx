import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import styles from "./AdminTable.module.css";

function AdminTableRoot({ children, className, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    <table className={cn(styles.root, className)} {...props}>
      {children}
    </table>
  );
}

function AdminTableScrollContainer({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn(styles.scroll, className)} {...props}>
      {children}
    </div>
  );
}

function AdminTableHeader({ children, className, ...props }: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead className={cn(styles.head, className)} {...props}>
      {children}
    </thead>
  );
}

function AdminTableBody({ children, className, ...props }: ComponentPropsWithoutRef<"tbody">) {
  return (
    <tbody className={cn(styles.body, className)} {...props}>
      {children}
    </tbody>
  );
}

function AdminTableRow({
  children,
  className,
  id,
  ...props
}: ComponentPropsWithoutRef<"tr"> & { id?: string }) {
  return (
    <tr className={className} data-row-id={id} {...props}>
      {children}
    </tr>
  );
}

function AdminTableColumn({
  children,
  className,
  isRowHeader,
  ...props
}: ComponentPropsWithoutRef<"th"> & { isRowHeader?: boolean }) {
  return (
    <th className={className} scope={isRowHeader ? "col" : undefined} {...props}>
      {children}
    </th>
  );
}

function AdminTableCell({ children, className, ...props }: ComponentPropsWithoutRef<"td">) {
  return (
    <td className={cn(styles.cell, className)} {...props}>
      {children}
    </td>
  );
}

function AdminTableContent({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const AdminTable = Object.assign(AdminTableRoot, {
  Body: AdminTableBody,
  Cell: AdminTableCell,
  Column: AdminTableColumn,
  Content: AdminTableContent,
  Header: AdminTableHeader,
  Row: AdminTableRow,
  ScrollContainer: AdminTableScrollContainer,
});
