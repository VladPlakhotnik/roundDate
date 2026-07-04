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
import { useI18n } from "@/shared/i18n/I18nProvider";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { BrandLogo } from "@/shared/ui/BrandLogo";
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
    subtitleKey: "onboarding.steps.profile.subtitle",
    titleKey: "onboarding.steps.profile.title",
  },
  {
    subtitleKey: "onboarding.steps.source.subtitle",
    titleKey: "onboarding.steps.source.title",
  },
  {
    subtitleKey: "onboarding.steps.preferences.subtitle",
    titleKey: "onboarding.steps.preferences.title",
  },
];

const providerCopy = {
  email: "onboarding.provider.email",
  google: "onboarding.provider.google",
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

function ProviderMark({ provider }: Pick<ProfileOnboardingState, "provider">) {
  if (provider === "google") {
    return <GoogleMark />;
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
  const { t } = useI18n();
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
  const genderOptions = onboardingGenderOptions.map((option) => ({
    label: t(`onboarding.options.gender.${option.value}`),
    value: option.value,
  }));
  const interestOptions = onboardingInterestOptions.map((option) => ({
    label: t(`onboarding.options.interest.${option.value}`),
    value: option.value,
  }));
  const discoverySourceOptions = onboardingDiscoverySourceOptions.map((option) => ({
    label: t(`onboarding.options.discovery.${option.value}`),
    value: option.value,
  }));
  const dayOptions = onboardingDayOptions.map((option) => ({
    label: t(`onboarding.options.weekdays.${option.value}`),
    value: option.value,
  }));
  const timeOptions = onboardingTimeOptions.map((option) => ({
    label: t(`onboarding.options.time.${option.value}`),
    value: option.value,
  }));

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
      showError(t("onboarding.errors.source"));
      return;
    }

    setError(null);
    setStep((current) => Math.min(current + 1, stepCopy.length - 1));
  }

  function finish() {
    if (!formData.preferredDays.length || !formData.preferredTimes.length) {
      showError(t("onboarding.errors.preferences"));
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
        showError(t("onboarding.errors.save"));
        return;
      }

      toast.success(t("onboarding.success.title"), t("onboarding.success.description"));
      router.push("/profile");
      router.refresh();
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="onboarding-title">
        <header className={styles.header}>
          <BrandLogo className={styles.logo} size="sm" />
          <div className={styles.progressTrack} aria-hidden>
            <span className={styles.progressBar} style={{ width: progress }} />
          </div>
          <h1 className={styles.title} id="onboarding-title">
            {t(copy.titleKey)}
          </h1>
          <p className={styles.subtitle}>{t(copy.subtitleKey)}</p>
        </header>

        <div className={styles.body}>
          {step === 0 ? (
            <div className={styles.profileStep}>
              <div className={styles.providerCard}>
                <div className={styles.avatarWrap}>
                  {initialState.user.image ? (
                    <span
                      aria-label={t("onboarding.fields.profilePhotoAria")}
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
                  <p className={styles.providerTitle}>{t(providerCopy[initialState.provider])}</p>
                  <p className={styles.providerText}>{t("onboarding.provider.text")}</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <Input
                  label={t("common.form.firstName")}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  placeholder={t("onboarding.fields.firstNamePlaceholder")}
                  size="md"
                  value={formData.firstName}
                />
                <Input
                  label={t("common.form.lastName")}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  placeholder={t("onboarding.fields.lastNamePlaceholder")}
                  size="md"
                  value={formData.lastName}
                />
                <DatePicker
                  label={t("onboarding.fields.birthDate")}
                  max={maxBirthDate}
                  maxYear={new Date(maxBirthDate).getFullYear()}
                  onChange={(value) => updateField("birthDate", value)}
                  value={formData.birthDate}
                />
                <Select
                  label={t("onboarding.fields.gender")}
                  onChange={(value) => updateField("gender", value as OnboardingFormData["gender"])}
                  options={genderOptions}
                  value={formData.gender}
                />
                <Select
                  label={t("onboarding.fields.interestedIn")}
                  onChange={(value) =>
                    updateField("interestedIn", value as OnboardingFormData["interestedIn"])
                  }
                  options={interestOptions}
                  value={formData.interestedIn}
                />
                <Input
                  label={t("onboarding.fields.phoneOptional")}
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
              {discoverySourceOptions.map((option) => {
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
                <p className={styles.groupLabel}>{t("onboarding.preferences.days")}</p>
                <div className={styles.chipGrid}>
                  {dayOptions.map((option) => {
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
                <p className={styles.groupLabel}>{t("onboarding.preferences.time")}</p>
                <div className={styles.timeGrid}>
                  {timeOptions.map((option) => {
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
                    <strong>{t("onboarding.notifications.emailTitle")}</strong>
                    <small>{t("onboarding.notifications.emailDescription")}</small>
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
                  <span>{t("onboarding.notifications.marketing")}</span>
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
              {t("onboarding.actions.skip")}
            </Button>
          ) : (
            <Button
              leftIcon={<ChevronLeft aria-hidden size={17} />}
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              size="sm"
              variant="secondary"
            >
              {t("onboarding.actions.back")}
            </Button>
          )}

          {step < 2 ? (
            <Button rightIcon={<ChevronRight aria-hidden size={17} />} onClick={goNext} size="md">
              {t("onboarding.actions.next")}
            </Button>
          ) : (
            <Button disabled={isPending} isLoading={isPending} onClick={finish} size="md">
              {t("onboarding.actions.finish")}
            </Button>
          )}
        </footer>
      </section>
    </main>
  );
}
