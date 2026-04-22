const en = {
  common: {
    appName: "EasySlip HR",
    signOut: "Sign out",
    greeting: "Hello",
    back: "Back",
    sessionDebug: "Session debug",
  },
  metadata: {
    description:
      "EasySlip HR — Attendance, Leave & Approval Management System",
  },
  signin: {
    pageTitle: "Sign In",
    heading: "EasySlip HR",
    subtitle:
      "Enter your company email and we'll send you a magic link to sign in.",
    emailLabel: "Email",
    emailPlaceholder: "name@company.co.th",
    submitButton: "Send magic link",
    submitting: "Sending...",
    noPassword: "No password needed — email sign-in only.",
    magicLinkSent: "Magic link sent to",
    moreDetails: "View details",
    errorTitle: "Sign-in failed",
    emailInvalid: "Please enter a valid email address.",
    emailSendFailed: "Unable to send the email.",
    rateLimited: "Too many requests. Please wait a moment before trying again.",
    invalidData: "Invalid data.",
    errors: {
      AccessDenied:
        "Your account has been suspended or your employment status is no longer active (SUSPENDED / RESIGNED / TERMINATED). Please contact HR.",
      Verification:
        "This magic link has already been used or has expired. Please request a new one.",
      Configuration:
        "System configuration error. Contact CTO to check AUTH_* / RESEND_API_KEY settings.",
      Default: "Unable to sign in. Please try again.",
    },
    errorTitles: {
      AccessDenied: "Access denied",
      Verification: "Link expired",
      Configuration: "Configuration error",
      Default: "Something went wrong",
    },
  },
  checkEmail: {
    pageTitle: "Check your email",
    heading: "Check your email",
    instruction:
      "We sent a magic link to the email you provided. Click the link in the email to sign in. The link will expire in 24 hours.",
    notFound: "Can't find the email?",
    checkSpam: "Check your spam / junk folder.",
    waitMoment: "Wait a moment — it may take 1-2 minutes.",
    tryAgain: "Try sending again.",
    backToSignIn: "Back to sign in",
  },
  employee: {
    todayTitle: "Today",
    notClockedIn: "Not clocked in yet (stub — will be built Day 3+).",
  },
  hr: {
    overviewTitle: "HR Overview",
  },
  manager: {
    inboxTitle: "Manager Inbox",
    noPending:
      "No pending approval requests (stub page — will be built Day 3+).",
  },
  errors: {
    forbidden: "You do not have permission to access this page.",
    unauthorized: "Please sign in to continue.",
  },
} as const;

export default en;

// Widen literal string types to `string` so Thai dictionary can satisfy the same shape
type DeepStringify<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};
export type Dictionary = DeepStringify<typeof en>;
