"use client";

import { Check, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  onboardingDayOptions,
  onboardingDiscoverySourceOptions,
  onboardingGenderOptions,
  onboardingInterestOptions,
  onboardingTimeOptions,
  type OnboardingDay,
  type OnboardingDiscoverySource,
  type OnboardingFormData,
  type OnboardingTime,
  type ProfileOnboardingState,
} from "@/entities/profile/model/onboarding";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { DatePicker } from "@/shared/ui/DatePicker";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { useToast } from "@/shared/ui/Toast";

import styles from "./OnboardingFlow.module.css";

type OnboardingFlowProps = {
  initialState: ProfileOnboardingState;
};

const stepCopy = [
  {
    subtitle: "Базовая информация помогает подобрать подходящие знакомства.",
    title: "Создайте профиль",
  },
  {
    subtitle: "Это помогает нам понимать, какие каналы работают лучше.",
    title: "Откуда вы о нас узнали?",
  },
  {
    subtitle: "Выберите дни и время, чтобы мы предлагали подходящие вечера.",
    title: "Когда вам удобно?",
  },
];

const providerCopy = {
  email: "Вы вошли через email.",
  facebook: "Вы вошли через Facebook.",
  google: "Вы вошли через Google.",
};

function GoogleMark() {
  return (
    <svg className={styles.providerMark} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg className={styles.providerMark} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.88 11.86v-8.39H7.08V12h3.04V9.36c0-3 1.79-4.66 4.52-4.66 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.39A12 12 0 0 0 24 12Z"
      />
      <path
        fill="#fff"
        d="m16.65 15.47.53-3.47h-3.32V9.75c0-.95.46-1.87 1.95-1.87h1.51V4.93s-1.37-.23-2.68-.23c-2.73 0-4.52 1.66-4.52 4.66V12H7.08v3.47h3.04v8.39a12.2 12.2 0 0 0 3.74 0v-8.39h2.79Z"
      />
    </svg>
  );
}

function ProviderMark({ provider }: Pick<ProfileOnboardingState, "provider">) {
  if (provider === "google") {
    return <GoogleMark />;
  }

  if (provider === "facebook") {
    return <FacebookMark />;
  }

  return <Mail aria-hidden className={styles.providerMark} size={20} />;
}

function getDefaultBirthDate(value: string) {
  if (value) {
    return value;
  }

  const date = new Date();
  date.setFullYear(date.getFullYear() - 28);
  return date.toISOString().slice(0, 10);
}

function getMaxBirthDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().slice(0, 10);
}

function getInitialFormData(initialState: ProfileOnboardingState): OnboardingFormData {
  const profile = initialState.profile;

  return {
    ...profile,
    birthDate: getDefaultBirthDate(profile.birthDate),
    discoverySource: profile.discoverySource || "",
    emailNotifications: profile.emailNotifications,
    gender: profile.gender || "female",
    interestedIn: profile.interestedIn || "male",
    marketingConsent: profile.marketingConsent,
    preferredDays: profile.preferredDays.length ? profile.preferredDays : ["wed", "fri", "sat"],
    preferredTimes: profile.preferredTimes.length ? profile.preferredTimes : ["evening"],
  };
}

export function OnboardingFlow({ initialState }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>(() =>
    getInitialFormData(initialState),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const maxBirthDate = useMemo(() => getMaxBirthDate(), []);
  const copy = stepCopy[step] ?? stepCopy[0]!;
  const progress = `${((step + 1) / stepCopy.length) * 100}%`;

  function updateField<TKey extends keyof OnboardingFormData>(
    field: TKey,
    value: OnboardingFormData[TKey],
  ) {
    setFormData((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function toggleDay(value: OnboardingDay) {
    setFormData((current) => {
      const selected = current.preferredDays.includes(value);

      return {
        ...current,
        preferredDays: selected
          ? current.preferredDays.filter((day) => day !== value)
          : [...current.preferredDays, value],
      };
    });
  }

  function toggleTime(value: OnboardingTime) {
    setFormData((current) => {
      const selected = current.preferredTimes.includes(value);

      return {
        ...current,
        preferredTimes: selected
          ? current.preferredTimes.filter((time) => time !== value)
          : [...current.preferredTimes, value],
      };
    });
  }

  function showError(message: string) {
    setError(message);
    toast.error(message);
  }

  function goNext() {
    if (step === 1 && !formData.discoverySource) {
      showError("Выберите один вариант, чтобы продолжить.");
      return;
    }

    setError(null);
    setStep((current) => Math.min(current + 1, stepCopy.length - 1));
  }

  function finish() {
    if (!formData.preferredDays.length || !formData.preferredTimes.length) {
      showError("Выберите хотя бы один день и одно время.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/profile/onboarding", {
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        showError("Не удалось сохранить профиль. Попробуйте еще раз.");
        return;
      }

      toast.success("Профиль настроен.", "Теперь можно перейти в личный кабинет.");
      router.push("/profile");
      router.refresh();
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="onboarding-title">
        <header className={styles.header}>
          <span className={styles.logo}>SpeedDate</span>
          <div className={styles.progressTrack} aria-hidden>
            <span className={styles.progressBar} style={{ width: progress }} />
          </div>
          <h1 className={styles.title} id="onboarding-title">
            {copy.title}
          </h1>
          <p className={styles.subtitle}>{copy.subtitle}</p>
        </header>

        <div className={styles.body}>
          {step === 0 ? (
            <div className={styles.profileStep}>
              <div className={styles.providerCard}>
                <div className={styles.avatarWrap}>
                  {initialState.user.image ? (
                    <span
                      aria-label="Фото профиля"
                      className={styles.avatarImage}
                      role="img"
                      style={{ backgroundImage: `url("${initialState.user.image}")` }}
                    />
                  ) : (
                    <span className={styles.avatarFallback} aria-hidden>
                      {(formData.firstName || initialState.user.email).slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className={styles.providerIcon}>
                    <ProviderMark provider={initialState.provider} />
                  </span>
                </div>
                <div>
                  <p className={styles.providerTitle}>{providerCopy[initialState.provider]}</p>
                  <p className={styles.providerText}>
                    Имя и фото можно изменить перед тем, как перейти дальше.
                  </p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <Input
                  label="Имя"
                  onChange={(event) => updateField("firstName", event.target.value)}
                  placeholder="Введите имя"
                  size="md"
                  value={formData.firstName}
                />
                <Input
                  label="Фамилия"
                  onChange={(event) => updateField("lastName", event.target.value)}
                  placeholder="Введите фамилию"
                  size="md"
                  value={formData.lastName}
                />
                <DatePicker
                  label="Дата рождения"
                  max={maxBirthDate}
                  maxYear={new Date(maxBirthDate).getFullYear()}
                  onChange={(value) => updateField("birthDate", value)}
                  value={formData.birthDate}
                />
                <Select
                  label="Пол"
                  onChange={(value) => updateField("gender", value as OnboardingFormData["gender"])}
                  options={onboardingGenderOptions}
                  value={formData.gender}
                />
                <Select
                  label="Кого хотите встретить"
                  onChange={(value) =>
                    updateField("interestedIn", value as OnboardingFormData["interestedIn"])
                  }
                  options={onboardingInterestOptions}
                  value={formData.interestedIn}
                />
                <Input
                  label="Телефон (необязательно)"
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+48 500 123 456"
                  size="md"
                  type="tel"
                  value={formData.phone}
                />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className={styles.sourceList}>
              {onboardingDiscoverySourceOptions.map((option) => {
                const selected = formData.discoverySource === option.value;

                return (
                  <button
                    aria-pressed={selected}
                    className={cn(styles.sourceOption, selected && styles.sourceOptionActive)}
                    key={option.value}
                    onClick={() =>
                      updateField("discoverySource", option.value as OnboardingDiscoverySource)
                    }
                    type="button"
                  >
                    <span>{option.label}</span>
                    <span className={styles.radio}>
                      {selected ? <Check aria-hidden size={16} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 2 ? (
            <div className={styles.preferencesStep}>
              <div className={styles.choiceGroup}>
                <p className={styles.groupLabel}>Предпочитаемые дни</p>
                <div className={styles.chipGrid}>
                  {onboardingDayOptions.map((option) => {
                    const selected = formData.preferredDays.includes(option.value);

                    return (
                      <button
                        aria-pressed={selected}
                        className={cn(styles.dayChip, selected && styles.dayChipActive)}
                        key={option.value}
                        onClick={() => toggleDay(option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.choiceGroup}>
                <p className={styles.groupLabel}>Удобное время</p>
                <div className={styles.timeGrid}>
                  {onboardingTimeOptions.map((option) => {
                    const selected = formData.preferredTimes.includes(option.value);

                    return (
                      <button
                        aria-pressed={selected}
                        className={cn(styles.timeChip, selected && styles.timeChipActive)}
                        key={option.value}
                        onClick={() => toggleTime(option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.settingsBox}>
                <label className={styles.switchRow}>
                  <span>
                    <strong>Получать email-уведомления</strong>
                    <small>Напомним о новых вечерах и подтверждениях записи.</small>
                  </span>
                  <input
                    checked={formData.emailNotifications}
                    onChange={(event) => updateField("emailNotifications", event.target.checked)}
                    type="checkbox"
                  />
                  <span className={styles.switchControl} aria-hidden />
                </label>

                <label className={styles.checkboxRow}>
                  <input
                    checked={formData.marketingConsent}
                    onChange={(event) => updateField("marketingConsent", event.target.checked)}
                    type="checkbox"
                  />
                  <span className={styles.checkboxControl} aria-hidden />
                  <span>Согласие на маркетинговые рассылки</span>
                </label>
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <footer className={styles.footer}>
          {step === 0 ? (
            <Button
              className={styles.textButton}
              onClick={() => setStep(1)}
              size="sm"
              variant="link"
            >
              Пропустить этот шаг
            </Button>
          ) : (
            <Button
              leftIcon={<ChevronLeft aria-hidden size={17} />}
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              size="sm"
              variant="secondary"
            >
              Назад
            </Button>
          )}

          {step < 2 ? (
            <Button rightIcon={<ChevronRight aria-hidden size={17} />} onClick={goNext} size="md">
              Далее
            </Button>
          ) : (
            <Button disabled={isPending} isLoading={isPending} onClick={finish} size="md">
              Завершить
            </Button>
          )}
        </footer>
      </section>
    </main>
  );
}
