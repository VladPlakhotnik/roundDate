"use client";

import {
  Bell,
  CalendarClock,
  Camera,
  ChevronRight,
  Clock3,
  CreditCard,
  Globe2,
  Heart,
  Link2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import type {
  OnboardingAuthProvider,
  OnboardingDay,
  OnboardingTime,
} from "@/entities/profile/model/onboarding";
import { PasswordRequirements } from "@/features/auth/components/PasswordRequirements";
import type { UserPaymentHistoryItem } from "@/entities/events/server/user-payments";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { localeLabels, locales, resolveLocale, type Locale } from "@/shared/i18n/locales";
import { authClient } from "@/shared/lib/auth-client";
import { isPasswordValid } from "@/shared/lib/validation/password";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { RangeSlider, type RangeSliderValue } from "@/shared/ui/RangeSlider";
import { Select } from "@/shared/ui/Select";
import { GoogleLogo } from "@/shared/ui/SocialLogo";
import { Switch } from "@/shared/ui/Switch";
import { useToast } from "@/shared/ui/Toast";

import styles from "./ProfileView.module.css";

type SettingsSection = "account" | "notifications" | "payments" | "preferences";

type ProfileSettingsAccount = {
  displayName: string;
  email: string;
  emailNotifications: boolean;
  eventCriteriaNotifications: boolean;
  eventReminderNotifications: boolean;
  eventResultNotifications: boolean;
  firstName: string;
  hasPassword: boolean;
  image: string | null;
  lastName: string;
  linkedProviders: OnboardingAuthProvider[];
  locale: string;
  marketingConsent: boolean;
  newDateNotifications: boolean;
  phone: string;
  preferredDays: OnboardingDay[];
  preferredTimes: OnboardingTime[];
  provider: OnboardingAuthProvider;
};

type ProfileSettingsAccountProps = {
  account: ProfileSettingsAccount;
};

type ProfileSettingsViewProps = {
  account: ProfileSettingsAccount;
  payments: UserPaymentHistoryItem[];
};

type PaymentsSettingsProps = {
  payments: UserPaymentHistoryItem[];
};

type NotificationKey = "eventReminders" | "eventResults" | "newEvents";

type AccountDialog = "delete" | "email" | "name" | "password" | "phone" | null;

const settingsSections = [
  { icon: UserRound, id: "account", labelKey: "profile.settingsPage.nav.account" },
  { icon: Bell, id: "notifications", labelKey: "profile.settingsPage.nav.notifications" },
  { icon: Heart, id: "preferences", labelKey: "profile.settingsPage.nav.preferences" },
  { icon: CreditCard, id: "payments", labelKey: "profile.settingsPage.nav.payments" },
] satisfies Array<{ icon: LucideIcon; id: SettingsSection; labelKey: string }>;

const languageOptions = locales.map((locale) => ({
  label: localeLabels[locale],
  value: locale,
})) satisfies Array<{ label: string; value: Locale }>;

const districtOptions = [
  { labelKey: "profile.settingsPage.preferences.districtOldTown", value: "old-town" },
  { disabled: true, label: "Wrzeszcz", value: "wrzeszcz" },
  { disabled: true, label: "Oliwa", value: "oliwa" },
];

const dayOptions = [
  { labelKey: "profile.settingsPage.preferences.weekdays.mon", value: "mon" },
  { labelKey: "profile.settingsPage.preferences.weekdays.tue", value: "tue" },
  { labelKey: "profile.settingsPage.preferences.weekdays.wed", value: "wed" },
  { labelKey: "profile.settingsPage.preferences.weekdays.thu", value: "thu" },
  { labelKey: "profile.settingsPage.preferences.weekdays.fri", value: "fri" },
  { labelKey: "profile.settingsPage.preferences.weekdays.sat", value: "sat" },
  { labelKey: "profile.settingsPage.preferences.weekdays.sun", value: "sun" },
] satisfies Array<{ labelKey: string; value: OnboardingDay }>;

const timePreferenceLabels = {
  day: "profile.settingsPage.preferences.timePreferences.day",
  evening: "profile.settingsPage.preferences.timePreferences.evening",
  late: "profile.settingsPage.preferences.timePreferences.late",
} satisfies Record<OnboardingTime, string>;

const notificationTitles = {
  eventReminders: "profile.settingsPage.notifications.eventReminders.title",
  eventResults: "profile.settingsPage.notifications.eventResults.title",
  newEvents: "profile.settingsPage.notifications.newEvents.title",
} satisfies Record<NotificationKey, string>;

function formatTimeRangeValue(value: number) {
  return `${String(value).padStart(2, "0")}:00`;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

async function readApiResponse(response: Response, fallbackMessage: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
    message?: string;
  } | null;

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
}

function SettingsPanel({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  description?: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className={styles.settingsPanel}>
      <div className={styles.settingsPanelHeader}>
        <span className={styles.settingsPanelIcon}>
          <Icon aria-hidden size={21} />
        </span>
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function SettingsActionRow({
  actionLabel,
  children,
  icon: Icon,
  onAction,
  title,
}: {
  actionLabel: string;
  children: ReactNode;
  icon: LucideIcon;
  onAction: () => void;
  title: string;
}) {
  return (
    <div className={styles.settingsActionRow}>
      <span className={styles.settingsActionIcon}>
        <Icon aria-hidden size={20} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
      <Button
        rightIcon={<ChevronRight aria-hidden size={16} />}
        size="sm"
        variant="outline"
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

function SettingsToggleRow({
  checked,
  description,
  disabled = false,
  icon: Icon,
  onChange,
  title,
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  icon: LucideIcon;
  onChange: () => void;
  title: string;
}) {
  const { t } = useI18n();

  return (
    <div className={styles.settingsToggleRow}>
      <span className={styles.settingsActionIcon}>
        <Icon aria-hidden size={20} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <Switch
        aria-label={t(
          checked
            ? "profile.settingsPage.notifications.ariaDisable"
            : "profile.settingsPage.notifications.ariaEnable",
          { title },
        )}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}

function AccountSettings({ account }: ProfileSettingsAccountProps) {
  const { locale, setLocale, t } = useI18n();
  const [accountState, setAccountState] = useState(() => ({
    ...account,
    locale,
  }));
  const [dialog, setDialog] = useState<AccountDialog>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const avatarStyle = accountState.image
    ? { backgroundImage: `url(${accountState.image})` }
    : undefined;
  const initials = getInitials(accountState.displayName) || "RD";
  const linkedAccounts = [
    {
      connected: accountState.linkedProviders.includes("google"),
      icon: <GoogleLogo className={styles.settingsProviderLogo} />,
      label: "Google",
      subtitle: t("profile.settingsPage.account.providerGoogleSubtitle"),
    },
    {
      connected: accountState.hasPassword,
      icon: <Mail aria-hidden size={18} />,
      label: "Email",
      subtitle: t("profile.settingsPage.account.providerEmailSubtitle"),
    },
  ];

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);
    setIsUploadingAvatar(true);

    try {
      const response = await fetch("/api/profile/settings/avatar", {
        method: "POST",
        body: formData,
      });
      const data = (await readApiResponse(response, t("profile.settingsPage.apiError"))) as {
        image?: string;
      };

      if (data.image) {
        setAccountState((current) => ({ ...current, image: data.image ?? current.image }));
      }

      toast.success(t("profile.settingsPage.account.avatarUpdated"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("profile.settingsPage.account.avatarUpdateError"),
      );
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  }

  async function handleLanguageChange(nextLocale: string) {
    const previousLocale = locale;
    const resolvedNextLocale = resolveLocale(nextLocale);
    setAccountState((current) => ({ ...current, locale: resolvedNextLocale }));
    setLocale(resolvedNextLocale);

    try {
      const response = await fetch("/api/profile/settings/language", {
        body: JSON.stringify({ locale: resolvedNextLocale }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      await readApiResponse(response, t("profile.settingsPage.apiError"));
      toast.success(t("profile.settingsPage.account.languageSaved"));
    } catch (error) {
      setAccountState((current) => ({ ...current, locale: previousLocale }));
      setLocale(previousLocale);
      toast.error(
        error instanceof Error
          ? error.message
          : t("profile.settingsPage.account.languageSaveError"),
      );
    }
  }

  async function submitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "");
    const lastName = String(formData.get("lastName") ?? "");
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile/settings/name", {
        body: JSON.stringify({ firstName, lastName }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const data = (await readApiResponse(response, t("profile.settingsPage.apiError"))) as {
        displayName?: string;
        firstName?: string;
        lastName?: string;
      };

      setAccountState((current) => ({
        ...current,
        displayName: data.displayName ?? current.displayName,
        firstName: data.firstName ?? current.firstName,
        lastName: data.lastName ?? current.lastName,
      }));
      setDialog(null);
      toast.success(t("profile.settingsPage.account.nameSaved"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("profile.settingsPage.account.nameSaveError"),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();

    if (email === accountState.email.trim().toLowerCase()) {
      toast.error(t("profile.settingsPage.account.emailUnchanged"));
      return;
    }

    setIsSaving(true);

    try {
      const result = await authClient.changeEmail({
        callbackURL: "/profile/settings",
        newEmail: email,
      });

      if (result.error) {
        throw new Error(t("profile.settingsPage.account.emailSendError"));
      }

      setDialog(null);
      toast.success(t("profile.settingsPage.account.emailConfirmationSent"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("profile.settingsPage.account.emailSendError"),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function submitPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const phone = String(formData.get("phone") ?? "");
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile/settings/phone", {
        body: JSON.stringify({ phone }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const data = (await readApiResponse(response, t("profile.settingsPage.apiError"))) as {
        phone?: string;
      };
      setAccountState((current) => ({ ...current, phone: data.phone ?? "" }));
      setDialog(null);
      toast.success(t("profile.settingsPage.account.phoneSaved"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("profile.settingsPage.account.phoneSaveError"),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

    if (newPassword !== passwordConfirm) {
      toast.error(t("profile.settingsPage.account.passwordMismatch"));
      return;
    }

    setIsSaving(true);

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        throw new Error(t("profile.settingsPage.account.passwordSaveError"));
      }

      setDialog(null);
      toast.success(t("profile.settingsPage.account.passwordSaved"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("profile.settingsPage.account.passwordSaveError"),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function requestPasswordSetup() {
    setIsSaving(true);

    try {
      const result = await authClient.requestPasswordReset({
        email: accountState.email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        throw new Error(t("profile.settingsPage.account.passwordSetupEmailError"));
      }

      setDialog(null);
      toast.success(t("profile.settingsPage.account.passwordSetupEmailSent"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("profile.settingsPage.account.passwordSetupEmailError"),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteAccount() {
    setIsSaving(true);

    try {
      const result = await authClient.deleteUser({
        callbackURL: "/",
      });

      if (result.error) {
        throw new Error(t("profile.settingsPage.account.deleteError"));
      }

      toast.success(t("profile.settingsPage.account.deleteSuccess"));
      window.location.assign("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("profile.settingsPage.account.deleteError"),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.settingsSection}>
      <SettingsPanel
        description={t("profile.settingsPage.account.description")}
        icon={UserRound}
        title={t("profile.settingsPage.account.title")}
      >
        <div className={styles.settingsAvatarCard}>
          <span className={styles.settingsAvatar} style={avatarStyle}>
            {accountState.image ? null : initials}
          </span>
          <div>
            <h3>{accountState.displayName}</h3>
            <p>{accountState.email}</p>
          </div>
          <input
            ref={avatarInputRef}
            aria-hidden
            accept="image/jpeg,image/png,image/webp"
            className={styles.settingsFileInput}
            name="avatar"
            tabIndex={-1}
            type="file"
            onChange={handleAvatarChange}
          />
          <Button
            disabled={isUploadingAvatar}
            isLoading={isUploadingAvatar}
            leftIcon={<Camera aria-hidden size={16} />}
            size="sm"
            variant="secondary"
            onClick={() => avatarInputRef.current?.click()}
          >
            {t("profile.settingsPage.account.changePhoto")}
          </Button>
        </div>

        <div className={styles.settingsRows}>
          <SettingsActionRow
            actionLabel={t("profile.settingsPage.actions.change")}
            icon={UserRound}
            title={t("profile.settingsPage.account.nameRow")}
            onAction={() => setDialog("name")}
          >
            {accountState.displayName}
          </SettingsActionRow>
          <SettingsActionRow
            actionLabel={t("profile.settingsPage.actions.change")}
            icon={Mail}
            title="Email"
            onAction={() => setDialog("email")}
          >
            {accountState.email}
          </SettingsActionRow>
          <SettingsActionRow
            actionLabel={
              accountState.phone
                ? t("profile.settingsPage.actions.change")
                : t("profile.settingsPage.actions.link")
            }
            icon={Phone}
            title={t("common.form.phone")}
            onAction={() => setDialog("phone")}
          >
            {accountState.phone || t("profile.settingsPage.account.phoneEmpty")}
          </SettingsActionRow>
          <SettingsActionRow
            actionLabel={
              accountState.hasPassword
                ? t("profile.settingsPage.actions.change")
                : t("profile.settingsPage.actions.link")
            }
            icon={LockKeyhole}
            title={t("profile.settingsPage.account.password")}
            onAction={() => {
              setNewPasswordValue("");
              setDialog("password");
            }}
          >
            {accountState.hasPassword
              ? t("profile.settingsPage.account.passwordUpdateDescription")
              : t("profile.settingsPage.account.passwordAddDescription")}
          </SettingsActionRow>
          <div className={styles.settingsActionRow}>
            <span className={styles.settingsActionIcon}>
              <Globe2 aria-hidden size={20} />
            </span>
            <div>
              <h3>{t("profile.settingsPage.account.language")}</h3>
              <p>{t("profile.settingsPage.account.languageDescription")}</p>
            </div>
            <Select
              className={styles.settingsSelect ?? ""}
              options={languageOptions}
              size="sm"
              value={resolveLocale(locale)}
              onChange={handleLanguageChange}
            />
          </div>
        </div>
      </SettingsPanel>

      <SettingsPanel
        description={t("profile.settingsPage.account.linkedAccountsDescription")}
        icon={Link2}
        title={t("profile.settingsPage.account.linkedAccounts")}
      >
        <div className={styles.settingsLinkedList}>
          {linkedAccounts.map((provider) => (
            <div className={styles.settingsProviderRow} key={provider.label}>
              <span className={styles.settingsProviderIcon}>{provider.icon}</span>
              <div>
                <h3>{provider.label}</h3>
                <p>{provider.subtitle}</p>
              </div>
              <Button size="sm" variant={provider.connected ? "soft" : "outline"}>
                {provider.connected
                  ? t("profile.settingsPage.actions.connected")
                  : t("profile.settingsPage.actions.connect")}
              </Button>
            </div>
          ))}
        </div>
      </SettingsPanel>

      <section className={styles.settingsDangerPanel}>
        <div>
          <h2>{t("profile.settingsPage.account.deleteAccount")}</h2>
          <p>{t("profile.settingsPage.account.deleteDescription")}</p>
        </div>
        <Button
          leftIcon={<Trash2 aria-hidden size={16} />}
          size="sm"
          variant="outline"
          onClick={() => setDialog("delete")}
        >
          {t("profile.settingsPage.account.deleteAccount")}
        </Button>
      </section>

      <Modal
        open={dialog === "name"}
        size="sm"
        title={t("profile.settingsPage.account.nameTitle")}
        onOpenChange={(open) => setDialog(open ? "name" : null)}
      >
        <form className={styles.settingsModalForm} onSubmit={submitName} noValidate>
          <p className={styles.settingsModalText}>
            {t("profile.settingsPage.account.nameDescription")}
          </p>
          <Input
            autoComplete="given-name"
            defaultValue={accountState.firstName}
            label={t("common.form.firstName")}
            name="firstName"
            required
          />
          <Input
            autoComplete="family-name"
            defaultValue={accountState.lastName}
            label={t("common.form.lastName")}
            name="lastName"
          />
          <div className={styles.settingsModalActions}>
            <Button variant="outline" onClick={() => setDialog(null)}>
              {t("common.actions.cancel")}
            </Button>
            <Button disabled={isSaving} isLoading={isSaving} type="submit">
              {t("common.actions.save")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog === "email"}
        size="sm"
        title={t("profile.settingsPage.account.emailTitle")}
        onOpenChange={(open) => setDialog(open ? "email" : null)}
      >
        <form className={styles.settingsModalForm} onSubmit={submitEmail} noValidate>
          <p className={styles.settingsModalText}>
            {t("profile.settingsPage.account.emailChangeDescription")}
          </p>
          <Input
            autoComplete="email"
            defaultValue={accountState.email}
            label={t("profile.settingsPage.account.newEmail")}
            name="email"
            required
            type="email"
          />
          <div className={styles.settingsModalActions}>
            <Button variant="outline" onClick={() => setDialog(null)}>
              {t("common.actions.cancel")}
            </Button>
            <Button disabled={isSaving} isLoading={isSaving} type="submit">
              {t("profile.settingsPage.actions.sendEmail")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog === "phone"}
        size="sm"
        title={
          accountState.phone
            ? t("profile.settingsPage.account.phoneTitleChange")
            : t("profile.settingsPage.account.phoneTitleAdd")
        }
        onOpenChange={(open) => setDialog(open ? "phone" : null)}
      >
        <form className={styles.settingsModalForm} onSubmit={submitPhone} noValidate>
          <p className={styles.settingsModalText}>
            {t("profile.settingsPage.account.phoneDescription")}
          </p>
          <Input
            autoComplete="tel"
            defaultValue={accountState.phone}
            label={t("common.form.phone")}
            name="phone"
            placeholder="+48 512 345 678"
            type="tel"
          />
          <div className={styles.settingsModalActions}>
            <Button variant="outline" onClick={() => setDialog(null)}>
              {t("common.actions.cancel")}
            </Button>
            <Button disabled={isSaving} isLoading={isSaving} type="submit">
              {t("common.actions.save")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog === "password"}
        size="sm"
        title={
          accountState.hasPassword
            ? t("profile.settingsPage.account.passwordTitleChange")
            : t("profile.settingsPage.account.passwordTitleAdd")
        }
        onOpenChange={(open) => {
          setDialog(open ? "password" : null);

          if (!open) {
            setNewPasswordValue("");
          }
        }}
      >
        {accountState.hasPassword ? (
          <form className={styles.settingsModalForm} onSubmit={submitPassword} noValidate>
            <p className={styles.settingsModalText}>
              {t("profile.settingsPage.account.passwordChangeDescription")}
            </p>
            <Input
              autoComplete="current-password"
              label={t("profile.settingsPage.account.passwordCurrent")}
              name="currentPassword"
              required
              type="password"
            />
            <Input
              autoComplete="new-password"
              label={t("profile.settingsPage.account.passwordNew")}
              name="newPassword"
              required
              type="password"
              value={newPasswordValue}
              onChange={(event) => setNewPasswordValue(event.currentTarget.value)}
            />
            <PasswordRequirements password={newPasswordValue} />
            <Input
              autoComplete="new-password"
              label={t("profile.settingsPage.account.passwordRepeat")}
              name="passwordConfirm"
              required
              type="password"
            />
            <div className={styles.settingsModalActions}>
              <Button variant="outline" onClick={() => setDialog(null)}>
                {t("common.actions.cancel")}
              </Button>
              <Button
                disabled={isSaving || !isPasswordValid(newPasswordValue)}
                isLoading={isSaving}
                type="submit"
              >
                {t("profile.settingsPage.actions.savePassword")}
              </Button>
            </div>
          </form>
        ) : (
          <div className={styles.settingsModalForm}>
            <p className={styles.settingsModalText}>
              {t("profile.settingsPage.account.passwordCreateDescription")}
            </p>
            <div className={styles.settingsModalActions}>
              <Button variant="outline" onClick={() => setDialog(null)}>
                {t("common.actions.cancel")}
              </Button>
              <Button disabled={isSaving} isLoading={isSaving} onClick={requestPasswordSetup}>
                {t("profile.settingsPage.actions.sendPasswordLink")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={dialog === "delete"}
        size="sm"
        title={t("profile.settingsPage.account.deleteModalTitle")}
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
      >
        <div className={styles.settingsModalForm}>
          <p className={styles.settingsModalText}>
            {t("profile.settingsPage.account.deleteModalDescription")}
          </p>
          <div className={styles.settingsModalActions}>
            <Button variant="outline" onClick={() => setDialog(null)}>
              {t("common.actions.cancel")}
            </Button>
            <Button
              disabled={isSaving}
              isLoading={isSaving}
              leftIcon={<Trash2 aria-hidden size={16} />}
              onClick={deleteAccount}
            >
              {t("profile.settingsPage.account.deleteConfirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function NotificationSettings({ account }: ProfileSettingsAccountProps) {
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    eventReminders: account.eventReminderNotifications,
    eventResults: account.eventResultNotifications,
    newEvents: account.marketingConsent,
  });
  const [savingKey, setSavingKey] = useState<NotificationKey | null>(null);
  const toast = useToast();
  const { t } = useI18n();

  async function saveNotifications(nextNotifications: Record<NotificationKey, boolean>) {
    const response = await fetch("/api/profile/settings/notifications", {
      body: JSON.stringify({
        eventReminderNotifications: nextNotifications.eventReminders,
        eventResultNotifications: nextNotifications.eventResults,
        newEventNotifications: nextNotifications.newEvents,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    await readApiResponse(response, t("profile.settingsPage.apiError"));
  }

  async function toggle(key: NotificationKey) {
    if (savingKey) {
      return;
    }

    const previousNotifications = notifications;
    const nextNotifications = { ...notifications, [key]: !notifications[key] };
    setNotifications(nextNotifications);
    setSavingKey(key);

    try {
      await saveNotifications(nextNotifications);
      toast.success(
        t("profile.settingsPage.notifications.saved", { title: t(notificationTitles[key]) }),
      );
    } catch (error) {
      setNotifications(previousNotifications);
      toast.error(
        error instanceof Error ? error.message : t("profile.settingsPage.notifications.saveError"),
      );
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className={styles.settingsSection}>
      <SettingsPanel
        description={t("profile.settingsPage.notifications.description")}
        icon={Bell}
        title={t("profile.settingsPage.notifications.title")}
      >
        <div className={styles.settingsRows}>
          <SettingsToggleRow
            checked={notifications.eventReminders}
            description={t("profile.settingsPage.notifications.eventReminders.description")}
            disabled={savingKey !== null}
            icon={CalendarClock}
            title={t("profile.settingsPage.notifications.eventReminders.title")}
            onChange={() => toggle("eventReminders")}
          />
          <SettingsToggleRow
            checked={notifications.eventResults}
            description={t("profile.settingsPage.notifications.eventResults.description")}
            disabled={savingKey !== null}
            icon={Heart}
            title={t("profile.settingsPage.notifications.eventResults.title")}
            onChange={() => toggle("eventResults")}
          />
          <SettingsToggleRow
            checked={notifications.newEvents}
            description={t("profile.settingsPage.notifications.newEvents.description")}
            disabled={savingKey !== null}
            icon={Mail}
            title={t("profile.settingsPage.notifications.newEvents.title")}
            onChange={() => toggle("newEvents")}
          />
        </div>
      </SettingsPanel>
    </div>
  );
}

function PreferenceSettings({ account }: ProfileSettingsAccountProps) {
  const { t } = useI18n();
  const initialDays: OnboardingDay[] = account.preferredDays.length
    ? account.preferredDays
    : ["fri", "sat"];
  const initialTimes: OnboardingTime[] = account.preferredTimes.length
    ? account.preferredTimes
    : ["evening"];
  const [ageRange, setAgeRange] = useState<RangeSliderValue>({ from: 25, to: 35 });
  const [days, setDays] = useState<OnboardingDay[]>(initialDays);
  const [timeRange, setTimeRange] = useState<RangeSliderValue>({ from: 18, to: 21 });
  const [district, setDistrict] = useState("old-town");

  const selectedTimeLabels = initialTimes.map((time) => t(timePreferenceLabels[time])).join(", ");
  const districtSelectOptions = districtOptions.map((option) => ({
    ...option,
    label:
      "labelKey" in option
        ? t(option.labelKey)
        : t("profile.settingsPage.preferences.comingSoon", { name: option.label }),
  }));

  function toggleDay(day: OnboardingDay) {
    setDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  }

  return (
    <div className={styles.settingsSection}>
      <SettingsPanel
        description={t("profile.settingsPage.preferences.description")}
        icon={Heart}
        title={t("profile.settingsPage.preferences.title")}
      >
        <div className={styles.settingsPreferenceGrid}>
          <div className={styles.settingsPreferenceBlock}>
            <div className={styles.settingsPreferenceHeader}>
              <span className={styles.settingsActionIcon}>
                <UserRound aria-hidden size={20} />
              </span>
              <div>
                <h3>{t("profile.settingsPage.preferences.age")}</h3>
                <p>
                  {t("profile.settingsPage.preferences.currentAge", {
                    from: ageRange.from,
                    to: ageRange.to,
                  })}
                </p>
              </div>
            </div>
            <RangeSlider
              label={t("profile.settingsPage.preferences.age")}
              max={65}
              min={18}
              value={ageRange}
              onChange={setAgeRange}
            />
          </div>

          <div className={styles.settingsPreferenceBlock}>
            <div className={styles.settingsPreferenceHeader}>
              <span className={styles.settingsActionIcon}>
                <CalendarClock aria-hidden size={20} />
              </span>
              <div>
                <h3>{t("profile.settingsPage.preferences.days")}</h3>
                <p>{t("profile.settingsPage.preferences.daysDescription")}</p>
              </div>
            </div>
            <div
              className={styles.settingsChips}
              aria-label={t("profile.settingsPage.preferences.daysAria")}
            >
              {dayOptions.map((day) => {
                const isActive = days.includes(day.value);

                return (
                  <button
                    aria-pressed={isActive}
                    className={isActive ? styles.settingsChipActive : styles.settingsChip}
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    type="button"
                  >
                    {t(day.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.settingsPreferenceBlock}>
            <div className={styles.settingsPreferenceHeader}>
              <span className={styles.settingsActionIcon}>
                <Clock3 aria-hidden size={20} />
              </span>
              <div>
                <h3>{t("profile.settingsPage.preferences.time")}</h3>
                <p>
                  {selectedTimeLabels || t("profile.settingsPage.preferences.evening")} ·{" "}
                  {formatTimeRangeValue(timeRange.from)}-{formatTimeRangeValue(timeRange.to)}
                </p>
              </div>
            </div>
            <RangeSlider
              formatValue={formatTimeRangeValue}
              label={t("profile.settingsPage.preferences.time")}
              max={24}
              min={10}
              value={timeRange}
              onChange={setTimeRange}
            />
          </div>

          <div className={styles.settingsPreferenceBlock}>
            <div className={styles.settingsPreferenceHeader}>
              <span className={styles.settingsActionIcon}>
                <MapPin aria-hidden size={20} />
              </span>
              <div>
                <h3>{t("profile.settingsPage.preferences.district")}</h3>
                <p>{t("profile.settingsPage.preferences.districtDescription")}</p>
              </div>
            </div>
            <Select
              disabled
              options={districtSelectOptions}
              size="sm"
              value={district}
              onChange={setDistrict}
            />
          </div>
        </div>
      </SettingsPanel>
    </div>
  );
}

function PaymentsSettings({ payments }: PaymentsSettingsProps) {
  const { t } = useI18n();

  return (
    <div className={styles.settingsSection}>
      <SettingsPanel
        description={t("profile.settingsPage.payments.description")}
        icon={CreditCard}
        title={t("profile.settingsPage.payments.title")}
      >
        <div className={styles.settingsPaymentList}>
          {payments.length ? (
            payments.map((payment) => (
              <div className={styles.settingsPaymentRow} key={payment.id}>
                <span className={styles.settingsActionIcon}>
                  <ReceiptText aria-hidden size={20} />
                </span>
                <div>
                  <h3>{payment.eventTitle}</h3>
                  <p>
                    {payment.eventDateLabel} · {payment.venueName}
                  </p>
                  <p className={styles.settingsPaymentMeta}>
                    {payment.paidAtLabel
                      ? t("profile.settingsPage.payments.paidAt", { date: payment.paidAtLabel })
                      : t("profile.settingsPage.payments.paidAtEmpty")}
                    {" · "}
                    {t("profile.settingsPage.payments.paymentMethod", {
                      method: payment.paymentMethodLabel,
                    })}
                    {payment.refundedAtLabel
                      ? ` · ${t("profile.settingsPage.payments.refundedAt", {
                          date: payment.refundedAtLabel,
                        })}`
                      : ""}
                  </p>
                </div>
                <strong className={styles.settingsPaymentStatus}>
                  {payment.statusLabel} · {payment.amountLabel}
                </strong>
              </div>
            ))
          ) : (
            <div className={styles.settingsPaymentEmpty}>
              <span className={styles.settingsActionIcon}>
                <ReceiptText aria-hidden size={20} />
              </span>
              <div>
                <h3>{t("profile.settingsPage.payments.emptyTitle")}</h3>
                <p>{t("profile.settingsPage.payments.emptyDescription")}</p>
              </div>
            </div>
          )}
        </div>
      </SettingsPanel>
    </div>
  );
}

export function ProfileSettingsView({ account, payments }: ProfileSettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const { t } = useI18n();

  return (
    <section className={styles.settingsScreen} aria-labelledby="profile-section-title">
      <div className={styles.settingsContent}>
        {activeSection === "account" ? <AccountSettings account={account} /> : null}
        {activeSection === "notifications" ? <NotificationSettings account={account} /> : null}
        {activeSection === "preferences" ? <PreferenceSettings account={account} /> : null}
        {activeSection === "payments" ? <PaymentsSettings payments={payments} /> : null}
      </div>

      <aside className={styles.settingsNav} aria-label={t("profile.settingsPage.navAria")}>
        {settingsSections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === activeSection;

          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className={isActive ? styles.settingsNavButtonActive : styles.settingsNavButton}
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              <Icon aria-hidden size={19} />
              <span>{t(section.labelKey)}</span>
            </button>
          );
        })}
      </aside>
    </section>
  );
}
