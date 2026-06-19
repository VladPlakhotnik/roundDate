export const onboardingGenderValues = ["female", "male", "other"] as const;
export const onboardingInterestValues = ["female", "male", "any"] as const;
export const onboardingDiscoverySourceValues = [
  "instagram",
  "tiktok",
  "facebook",
  "google",
  "friend",
  "poster",
  "venue",
  "other",
] as const;
export const onboardingDayValues = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const onboardingTimeValues = ["day", "evening", "late"] as const;

export type OnboardingAuthProvider = "email" | "facebook" | "google";
export type OnboardingGender = (typeof onboardingGenderValues)[number];
export type OnboardingInterest = (typeof onboardingInterestValues)[number];
export type OnboardingDiscoverySource = (typeof onboardingDiscoverySourceValues)[number];
export type OnboardingDay = (typeof onboardingDayValues)[number];
export type OnboardingTime = (typeof onboardingTimeValues)[number];

export type OnboardingOption<TValue extends string = string> = {
  label: string;
  value: TValue;
};

export const onboardingGenderOptions: OnboardingOption<OnboardingGender>[] = [
  { label: "Женщина", value: "female" },
  { label: "Мужчина", value: "male" },
  { label: "Другое", value: "other" },
];

export const onboardingInterestOptions: OnboardingOption<OnboardingInterest>[] = [
  { label: "Женщину", value: "female" },
  { label: "Мужчину", value: "male" },
  { label: "Любой формат", value: "any" },
];

export const onboardingDiscoverySourceOptions: OnboardingOption<OnboardingDiscoverySource>[] = [
  { label: "Instagram", value: "instagram" },
  { label: "TikTok", value: "tiktok" },
  { label: "Facebook", value: "facebook" },
  { label: "Google", value: "google" },
  { label: "Рекомендация друга", value: "friend" },
  { label: "Афиша / партнер", value: "poster" },
  { label: "Проходил мимо площадки", value: "venue" },
  { label: "Другое", value: "other" },
];

export const onboardingDayOptions: OnboardingOption<OnboardingDay>[] = [
  { label: "Пн", value: "mon" },
  { label: "Вт", value: "tue" },
  { label: "Ср", value: "wed" },
  { label: "Чт", value: "thu" },
  { label: "Пт", value: "fri" },
  { label: "Сб", value: "sat" },
  { label: "Вс", value: "sun" },
];

export const onboardingTimeOptions: OnboardingOption<OnboardingTime>[] = [
  { label: "День", value: "day" },
  { label: "Вечер", value: "evening" },
  { label: "Поздний вечер", value: "late" },
];

export type OnboardingFormData = {
  birthDate: string;
  discoverySource: OnboardingDiscoverySource | "";
  emailNotifications: boolean;
  eventCriteriaNotifications: boolean;
  eventReminderNotifications: boolean;
  eventResultNotifications: boolean;
  firstName: string;
  gender: OnboardingGender | "";
  interestedIn: OnboardingInterest | "";
  lastName: string;
  locale: string;
  marketingConsent: boolean;
  newDateNotifications: boolean;
  phone: string;
  preferredDays: OnboardingDay[];
  preferredTimes: OnboardingTime[];
};

export type ProfileOnboardingState = {
  hasPassword: boolean;
  linkedProviders: OnboardingAuthProvider[];
  profile: OnboardingFormData;
  provider: OnboardingAuthProvider;
  shouldShowOnboarding: boolean;
  user: {
    email: string;
    image: string | null;
    name: string;
  };
};
