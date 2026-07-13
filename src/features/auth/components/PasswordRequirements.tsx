"use client";

import { Check, X } from "lucide-react";

import { useI18n } from "@/shared/i18n/I18nProvider";
import {
  getPasswordRequirements,
  passwordRequirementIds,
  type PasswordRequirementId,
} from "@/shared/lib/validation/password";

import styles from "./PasswordRequirements.module.css";

const requirementLabelKeys = {
  length: "auth.passwordRequirements.length",
  letter: "auth.passwordRequirements.letter",
  number: "auth.passwordRequirements.number",
  noSpaces: "auth.passwordRequirements.noSpaces",
} satisfies Record<PasswordRequirementId, string>;

export function PasswordRequirements({ password }: { password: string }) {
  const { t } = useI18n();

  if (!password) {
    return null;
  }

  const requirements = getPasswordRequirements(password);
  const complete = passwordRequirementIds.every((requirement) => requirements[requirement]);

  if (complete) {
    return (
      <div className={styles.complete} aria-live="polite" role="status">
        <span aria-hidden>
          <Check size={15} strokeWidth={3} />
        </span>
        {t("auth.passwordRequirements.complete")}
      </div>
    );
  }

  return (
    <div className={styles.panel} aria-live="polite">
      <p>{t("auth.passwordRequirements.title")}</p>
      <ul>
        {passwordRequirementIds.map((requirement) => {
          const valid = requirements[requirement];
          const Icon = valid ? Check : X;

          return (
            <li data-valid={valid} key={requirement}>
              <span aria-hidden>
                <Icon size={14} strokeWidth={3} />
              </span>
              {t(requirementLabelKeys[requirement])}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
