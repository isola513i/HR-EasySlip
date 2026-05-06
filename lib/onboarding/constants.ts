export const ONBOARDING_CATEGORIES = [
  "personal",
  "address",
  "profile_picture",
  "emergency",
  "documents",
  "general",
] as const;
export type OnboardingCategory = (typeof ONBOARDING_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<OnboardingCategory, string> = {
  personal: "Personal Info",
  address: "Address",
  profile_picture: "Profile Picture",
  emergency: "Emergency Contact",
  documents: "Documents",
  general: "General",
};
