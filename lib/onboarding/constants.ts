export const ONBOARDING_CATEGORIES = ["personal", "address", "bank", "emergency", "general"] as const;
export type OnboardingCategory = (typeof ONBOARDING_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<OnboardingCategory, string> = {
  personal: "Personal Info",
  address: "Address",
  bank: "Bank",
  emergency: "Emergency Contact",
  general: "General",
};
