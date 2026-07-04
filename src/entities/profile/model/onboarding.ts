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

export type OnboardingAuthProvider = "email" | "google";
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
  { label: "Kobieta", value: "female" },
  { label: "Mężczyzna", value: "male" },
  { label: "Inna opcja", value: "other" },
];

export const onboardingInterestOptions: OnboardingOption<OnboardingInterest>[] = [
  { label: "Kobietę", value: "female" },
  { label: "Mężczyznę", value: "male" },
  { label: "Dowolny format", value: "any" },
];

export const onboardingDiscoverySourceOptions: OnboardingOption<OnboardingDiscoverySource>[] = [
  { label: "Instagram", value: "instagram" },
  { label: "TikTok", value: "tiktok" },
  { label: "Facebook", value: "facebook" },
  { label: "Google", value: "google" },
  { label: "Polecenie znajomego", value: "friend" },
  { label: "Plakat / partner", value: "poster" },
  { label: "Przechodziłem/am obok miejsca", value: "venue" },
  { label: "Inne", value: "other" },
];

export const onboardingDayOptions: OnboardingOption<OnboardingDay>[] = [
  { label: "Pon", value: "mon" },
  { label: "Wt", value: "tue" },
  { label: "Śr", value: "wed" },
  { label: "Czw", value: "thu" },
  { label: "Pt", value: "fri" },
  { label: "Sob", value: "sat" },
  { label: "Niedz", value: "sun" },
];

export const onboardingTimeOptions: OnboardingOption<OnboardingTime>[] = [
  { label: "Dzień", value: "day" },
  { label: "Wieczór", value: "evening" },
  { label: "Późny wieczór", value: "late" },
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
    role: "admin" | "manager" | "user";
  };
};
