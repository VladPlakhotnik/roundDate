import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth";

export function ResetPasswordView() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
