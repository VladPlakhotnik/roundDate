import type { Metadata } from "next";

import { ResetPasswordView } from "@/views/reset-password/page";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Reset hasla",
};

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
