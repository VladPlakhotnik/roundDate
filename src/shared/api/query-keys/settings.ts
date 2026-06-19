export const settingsQueryKeys = {
  all: ["settings"] as const,
  account: () => [...settingsQueryKeys.all, "account"] as const,
  notifications: () => [...settingsQueryKeys.all, "notifications"] as const,
  payments: () => [...settingsQueryKeys.all, "payments"] as const,
  preferences: () => [...settingsQueryKeys.all, "preferences"] as const,
};
