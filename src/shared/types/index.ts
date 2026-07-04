export type AppRole = "user" | "manager" | "admin";
export type Locale = "pl" | "en" | "es";
export type EventStatus = "cancelled" | "draft" | "finished" | "published" | "sold_out";
export type BookingStatus =
  | "attended"
  | "cancelled"
  | "confirmed"
  | "no_show"
  | "payment_failed"
  | "pending"
  | "pending_payment"
  | "refunded"
  | "waitlisted";
