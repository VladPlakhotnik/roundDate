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
  Settings,
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
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { RangeSlider, type RangeSliderValue } from "@/shared/ui/RangeSlider";
import { Select } from "@/shared/ui/Select";
import { FacebookLogo, GoogleLogo } from "@/shared/ui/SocialLogo";
import { Switch } from "@/shared/ui/Switch";
import { useToast } from "@/shared/ui/Toast";

import styles from "./ProfileView.module.css";

type SettingsSection = "account" | "notifications" | "payments" | "preferences";

type ProfileSettingsViewProps = {
  account: {
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
};

type NotificationKey =
  | "eventReminders"
  | "eventResults"
  | "marketing"
  | "newDates"
  | "newEventsByCriteria";

type AccountDialog = "delete" | "email" | "name" | "password" | "phone" | null;

const settingsSections = [
  { icon: UserRound, id: "account", label: "Информация об аккаунте" },
  { icon: Bell, id: "notifications", label: "Уведомления" },
  { icon: Heart, id: "preferences", label: "Предпочтения мероприятий" },
  { icon: CreditCard, id: "payments", label: "Оплаты" },
] satisfies Array<{ icon: LucideIcon; id: SettingsSection; label: string }>;

const languageOptions = [
  { label: "Русский", value: "ru" },
  { label: "English", value: "en" },
  { label: "Polski", value: "pl" },
];

const districtOptions = [
  { label: "Старый город", value: "old-town" },
  { disabled: true, label: "Wrzeszcz скоро", value: "wrzeszcz" },
  { disabled: true, label: "Oliwa скоро", value: "oliwa" },
];

const dayOptions = [
  { label: "Пн", value: "mon" },
  { label: "Вт", value: "tue" },
  { label: "Ср", value: "wed" },
  { label: "Чт", value: "thu" },
  { label: "Пт", value: "fri" },
  { label: "Сб", value: "sat" },
  { label: "Вс", value: "sun" },
] satisfies Array<{ label: string; value: OnboardingDay }>;

const timePreferenceLabels = {
  day: "Днем",
  evening: "Вечером",
  late: "Поздно",
} satisfies Record<OnboardingTime, string>;

const notificationTitles = {
  eventReminders: "Напоминания о мероприятиях",
  eventResults: "Результаты мероприятий",
  marketing: "Маркетинговые рассылки",
  newDates: "Новые даты",
  newEventsByCriteria: "Новые мероприятия по критериям",
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

async function readApiResponse(response: Response) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
    message?: string;
  } | null;

  if (!response.ok) {
    throw new Error(data?.error || "Что-то пошло не так. Попробуйте еще раз.");
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
        aria-label={checked ? `Отключить: ${title}` : `Включить: ${title}`}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}

function AccountSettings({ account }: ProfileSettingsViewProps) {
  const [accountState, setAccountState] = useState(account);
  const [dialog, setDialog] = useState<AccountDialog>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const avatarStyle = accountState.image
    ? { backgroundImage: `url(${accountState.image})` }
    : undefined;
  const initials = getInitials(accountState.displayName) || "SD";
  const linkedAccounts = [
    {
      connected: accountState.linkedProviders.includes("google"),
      icon: <GoogleLogo className={styles.settingsProviderLogo} />,
      label: "Google",
      subtitle: "Вход и быстрая регистрация через Google",
    },
    {
      connected: accountState.linkedProviders.includes("facebook"),
      icon: <FacebookLogo className={styles.settingsProviderLogo} />,
      label: "Facebook",
      subtitle: "Вход через социальный аккаунт",
    },
    {
      connected: accountState.hasPassword,
      icon: <Mail aria-hidden size={18} />,
      label: "Email",
      subtitle: "Классический вход по email и паролю",
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
      const data = (await readApiResponse(response)) as { image?: string };

      if (data.image) {
        setAccountState((current) => ({ ...current, image: data.image ?? current.image }));
      }

      toast.success("Фотография обновлена.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось обновить фотографию.");
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  }

  async function handleLanguageChange(nextLocale: string) {
    const previousLocale = accountState.locale;
    setAccountState((current) => ({ ...current, locale: nextLocale }));

    try {
      const response = await fetch("/api/profile/settings/language", {
        body: JSON.stringify({ locale: nextLocale }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      await readApiResponse(response);
      toast.success("Язык интерфейса сохранен.");
    } catch (error) {
      setAccountState((current) => ({ ...current, locale: previousLocale }));
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить язык.");
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
      const data = (await readApiResponse(response)) as {
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
      toast.success("Имя и фамилия сохранены.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить имя.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile/settings/email", {
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await readApiResponse(response);
      setDialog(null);
      toast.success(data?.message || "Письмо с подтверждением отправлено на новую почту.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось отправить подтверждение.");
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
      const data = (await readApiResponse(response)) as { phone?: string };
      setAccountState((current) => ({ ...current, phone: data.phone ?? "" }));
      setDialog(null);
      toast.success("Телефон сохранен.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить телефон.");
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
      toast.error("Пароли не совпадают.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/profile/settings/password", {
        body: JSON.stringify({
          currentPassword: accountState.hasPassword ? currentPassword : undefined,
          newPassword,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      await readApiResponse(response);
      setAccountState((current) => ({ ...current, hasPassword: true }));
      setDialog(null);
      toast.success(accountState.hasPassword ? "Пароль обновлен." : "Пароль привязан к аккаунту.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить пароль.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteAccount() {
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile/settings/account", {
        method: "DELETE",
      });
      await readApiResponse(response);
      toast.success("Аккаунт удален.");
      window.location.assign("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось удалить аккаунт.");
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.settingsSection}>
      <SettingsPanel
        description="Основные данные, которые используются для входа и связи по вашим записям."
        icon={UserRound}
        title="Информация об аккаунте"
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
            Изменить фото
          </Button>
        </div>

        <div className={styles.settingsRows}>
          <SettingsActionRow
            actionLabel="Изменить"
            icon={UserRound}
            title="Имя и фамилия"
            onAction={() => setDialog("name")}
          >
            {accountState.displayName}
          </SettingsActionRow>
          <SettingsActionRow
            actionLabel="Изменить"
            icon={Mail}
            title="Email"
            onAction={() => setDialog("email")}
          >
            {accountState.email}
          </SettingsActionRow>
          <SettingsActionRow
            actionLabel={accountState.phone ? "Изменить" : "Привязать"}
            icon={Phone}
            title="Телефон"
            onAction={() => setDialog("phone")}
          >
            {accountState.phone || "Телефон пока не привязан"}
          </SettingsActionRow>
          <SettingsActionRow
            actionLabel={accountState.hasPassword ? "Изменить" : "Привязать"}
            icon={LockKeyhole}
            title="Пароль"
            onAction={() => setDialog("password")}
          >
            {accountState.hasPassword
              ? "Обновите пароль для входа по email"
              : "Добавьте пароль для входа по email"}
          </SettingsActionRow>
          <div className={styles.settingsActionRow}>
            <span className={styles.settingsActionIcon}>
              <Globe2 aria-hidden size={20} />
            </span>
            <div>
              <h3>Язык интерфейса</h3>
              <p>Используется в личном кабинете и уведомлениях</p>
            </div>
            <Select
              className={styles.settingsSelect ?? ""}
              options={languageOptions}
              size="sm"
              value={accountState.locale}
              onChange={handleLanguageChange}
            />
          </div>
        </div>
      </SettingsPanel>

      <SettingsPanel
        description="Подключайте внешние аккаунты, чтобы входить быстрее и безопаснее."
        icon={Link2}
        title="Связанные аккаунты"
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
                {provider.connected ? "Подключен" : "Подключить"}
              </Button>
            </div>
          ))}
        </div>
      </SettingsPanel>

      <section className={styles.settingsDangerPanel}>
        <div>
          <h2>Удаление аккаунта</h2>
          <p>Удалит профиль, записи, историю платежей и настройки. Это действие нельзя отменить.</p>
        </div>
        <Button
          leftIcon={<Trash2 aria-hidden size={16} />}
          size="sm"
          variant="outline"
          onClick={() => setDialog("delete")}
        >
          Удалить аккаунт
        </Button>
      </section>

      <Modal
        open={dialog === "name"}
        size="sm"
        title="Изменить имя"
        onOpenChange={(open) => setDialog(open ? "name" : null)}
      >
        <form className={styles.settingsModalForm} onSubmit={submitName} noValidate>
          <p className={styles.settingsModalText}>
            Имя и фамилия будут отображаться в профиле и на главной странице.
          </p>
          <Input
            autoComplete="given-name"
            defaultValue={accountState.firstName}
            label="Имя"
            name="firstName"
            required
          />
          <Input
            autoComplete="family-name"
            defaultValue={accountState.lastName}
            label="Фамилия"
            name="lastName"
          />
          <div className={styles.settingsModalActions}>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Отмена
            </Button>
            <Button disabled={isSaving} isLoading={isSaving} type="submit">
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog === "email"}
        size="sm"
        title="Изменить email"
        onOpenChange={(open) => setDialog(open ? "email" : null)}
      >
        <form className={styles.settingsModalForm} onSubmit={submitEmail} noValidate>
          <p className={styles.settingsModalText}>
            На новую почту придет письмо с подтверждением. Email изменится только после перехода по
            ссылке.
          </p>
          <Input
            autoComplete="email"
            defaultValue={accountState.email}
            label="Новый email"
            name="email"
            required
            type="email"
          />
          <div className={styles.settingsModalActions}>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Отмена
            </Button>
            <Button disabled={isSaving} isLoading={isSaving} type="submit">
              Отправить письмо
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog === "phone"}
        size="sm"
        title={accountState.phone ? "Изменить телефон" : "Привязать телефон"}
        onOpenChange={(open) => setDialog(open ? "phone" : null)}
      >
        <form className={styles.settingsModalForm} onSubmit={submitPhone} noValidate>
          <p className={styles.settingsModalText}>
            СМС-подтверждение пока не подключаем. Номер сохранится сразу после отправки формы.
          </p>
          <Input
            autoComplete="tel"
            defaultValue={accountState.phone}
            label="Телефон"
            name="phone"
            placeholder="+48 512 345 678"
            type="tel"
          />
          <div className={styles.settingsModalActions}>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Отмена
            </Button>
            <Button disabled={isSaving} isLoading={isSaving} type="submit">
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog === "password"}
        size="sm"
        title={accountState.hasPassword ? "Изменить пароль" : "Привязать пароль"}
        onOpenChange={(open) => setDialog(open ? "password" : null)}
      >
        <form className={styles.settingsModalForm} onSubmit={submitPassword} noValidate>
          <p className={styles.settingsModalText}>
            {accountState.hasPassword
              ? "Введите текущий пароль и новый пароль."
              : "Задайте пароль, чтобы входить в аккаунт по email."}
          </p>
          {accountState.hasPassword ? (
            <Input
              autoComplete="current-password"
              label="Текущий пароль"
              name="currentPassword"
              required
              type="password"
            />
          ) : null}
          <Input
            autoComplete="new-password"
            label="Новый пароль"
            name="newPassword"
            required
            type="password"
          />
          <Input
            autoComplete="new-password"
            label="Повторите пароль"
            name="passwordConfirm"
            required
            type="password"
          />
          <div className={styles.settingsModalActions}>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Отмена
            </Button>
            <Button disabled={isSaving} isLoading={isSaving} type="submit">
              Сохранить пароль
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog === "delete"}
        size="sm"
        title="Удалить аккаунт?"
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
      >
        <div className={styles.settingsModalForm}>
          <p className={styles.settingsModalText}>
            Аккаунт, профиль, записи и связанные данные будут удалены. Это действие нельзя отменить.
          </p>
          <div className={styles.settingsModalActions}>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Отмена
            </Button>
            <Button
              disabled={isSaving}
              isLoading={isSaving}
              leftIcon={<Trash2 aria-hidden size={16} />}
              onClick={deleteAccount}
            >
              Да, удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function NotificationSettings({ account }: ProfileSettingsViewProps) {
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    eventReminders: account.eventReminderNotifications,
    eventResults: account.eventResultNotifications,
    marketing: account.marketingConsent,
    newDates: account.newDateNotifications,
    newEventsByCriteria: account.eventCriteriaNotifications,
  });
  const [savingKey, setSavingKey] = useState<NotificationKey | null>(null);
  const toast = useToast();

  async function saveNotifications(nextNotifications: Record<NotificationKey, boolean>) {
    const response = await fetch("/api/profile/settings/notifications", {
      body: JSON.stringify({
        eventCriteriaNotifications: nextNotifications.newEventsByCriteria,
        eventReminderNotifications: nextNotifications.eventReminders,
        eventResultNotifications: nextNotifications.eventResults,
        marketingConsent: nextNotifications.marketing,
        newDateNotifications: nextNotifications.newDates,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    await readApiResponse(response);
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
      toast.success(`${notificationTitles[key]} сохранены.`);
    } catch (error) {
      setNotifications(previousNotifications);
      toast.error(
        error instanceof Error ? error.message : "Не удалось сохранить настройки уведомлений.",
      );
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className={styles.settingsSection}>
      <SettingsPanel
        description="Выберите, какие сообщения SpeedDate будет отправлять вам в профиле и по email."
        icon={Bell}
        title="Уведомления"
      >
        <div className={styles.settingsRows}>
          <SettingsToggleRow
            checked={notifications.eventReminders}
            description="Напомним о времени, адресе и подготовке к мероприятию."
            disabled={savingKey !== null}
            icon={CalendarClock}
            title="Напоминания о мероприятиях"
            onChange={() => toggle("eventReminders")}
          />
          <SettingsToggleRow
            checked={notifications.eventResults}
            description="Сообщим, когда станут доступны результаты и мэтчи."
            disabled={savingKey !== null}
            icon={Heart}
            title="Результаты мероприятий"
            onChange={() => toggle("eventResults")}
          />
          <SettingsToggleRow
            checked={notifications.marketing}
            description="Редкие письма с подборками, акциями и полезными обновлениями."
            disabled={savingKey !== null}
            icon={Mail}
            title="Маркетинговые рассылки"
            onChange={() => toggle("marketing")}
          />
          <SettingsToggleRow
            checked={notifications.newDates}
            description="Новые даты ближайших встреч в вашем городе."
            disabled={savingKey !== null}
            icon={Clock3}
            title="Новые даты"
            onChange={() => toggle("newDates")}
          />
          <SettingsToggleRow
            checked={notifications.newEventsByCriteria}
            description="События, которые подходят по возрасту, времени и району."
            disabled={savingKey !== null}
            icon={Settings}
            title="Новые мероприятия по критериям"
            onChange={() => toggle("newEventsByCriteria")}
          />
        </div>
      </SettingsPanel>
    </div>
  );
}

function PreferenceSettings({ account }: ProfileSettingsViewProps) {
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

  const selectedTimeLabels = initialTimes.map((time) => timePreferenceLabels[time]).join(", ");

  function toggleDay(day: OnboardingDay) {
    setDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  }

  return (
    <div className={styles.settingsSection}>
      <SettingsPanel
        description="Эти фильтры помогут показывать мероприятия, которые лучше подходят вам."
        icon={Heart}
        title="Предпочтения мероприятий"
      >
        <div className={styles.settingsPreferenceGrid}>
          <div className={styles.settingsPreferenceBlock}>
            <div className={styles.settingsPreferenceHeader}>
              <span className={styles.settingsActionIcon}>
                <UserRound aria-hidden size={20} />
              </span>
              <div>
                <h3>Возраст</h3>
                <p>
                  Сейчас: {ageRange.from}-{ageRange.to}
                </p>
              </div>
            </div>
            <RangeSlider
              label="Возраст"
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
                <h3>Дни</h3>
                <p>Выберите удобные дни недели</p>
              </div>
            </div>
            <div className={styles.settingsChips} aria-label="Предпочтительные дни">
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
                    {day.label}
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
                <h3>Время</h3>
                <p>
                  {selectedTimeLabels || "Вечером"} · {formatTimeRangeValue(timeRange.from)}-
                  {formatTimeRangeValue(timeRange.to)}
                </p>
              </div>
            </div>
            <RangeSlider
              formatValue={formatTimeRangeValue}
              label="Время"
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
                <h3>Район</h3>
                <p>Пока доступен один район, позже добавим больше.</p>
              </div>
            </div>
            <Select
              disabled
              options={districtOptions}
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

function PaymentsSettings() {
  return (
    <div className={styles.settingsSection}>
      <SettingsPanel
        description="Здесь будет храниться информация об оплатах, способах платежа и чеках."
        icon={CreditCard}
        title="Оплаты"
      >
        <div className={styles.settingsPaymentHero}>
          <span className={styles.settingsPaymentIcon}>
            <CreditCard aria-hidden size={28} />
          </span>
          <div>
            <h3>Способ оплаты</h3>
            <p>Карта пока не добавлена. Для будущих записей можно будет сохранить способ оплаты.</p>
          </div>
          <Button size="sm" variant="secondary">
            Добавить карту
          </Button>
        </div>

        <div className={styles.settingsPaymentList}>
          <div className={styles.settingsPaymentRow}>
            <span className={styles.settingsActionIcon}>
              <ReceiptText aria-hidden size={20} />
            </span>
            <div>
              <h3>Speed dating 25-35</h3>
              <p>24 мая · Hotel Almond</p>
            </div>
            <strong>Оплачено · 69 PLN</strong>
          </div>
          <div className={styles.settingsPaymentRow}>
            <span className={styles.settingsActionIcon}>
              <CreditCard aria-hidden size={20} />
            </span>
            <div>
              <h3>Speed dating 32-44</h3>
              <p>31 мая · Loft event space</p>
            </div>
            <strong>Ожидает оплаты · 69 PLN</strong>
          </div>
        </div>
      </SettingsPanel>
    </div>
  );
}

export function ProfileSettingsView({ account }: ProfileSettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");

  return (
    <section className={styles.settingsScreen} aria-labelledby="profile-section-title">
      <div className={styles.settingsContent}>
        {activeSection === "account" ? <AccountSettings account={account} /> : null}
        {activeSection === "notifications" ? <NotificationSettings account={account} /> : null}
        {activeSection === "preferences" ? <PreferenceSettings account={account} /> : null}
        {activeSection === "payments" ? <PaymentsSettings /> : null}
      </div>

      <aside className={styles.settingsNav} aria-label="Разделы настроек">
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
              <span>{section.label}</span>
            </button>
          );
        })}
      </aside>
    </section>
  );
}
