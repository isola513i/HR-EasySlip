import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Generate initial password for new employees: EasySlip@{employeeCode} */
export function generateInitialPassword(employeeCode: string): string {
  return `EasySlip@${employeeCode}`;
}

/** Generate a cryptographically random temporary password for HR resets */
export function generateTempPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

/** Employment statuses that block sign-in */
export const BLOCKED_EMPLOYMENT_STATUSES = [
  "SUSPENDED",
  "RESIGNED",
  "TERMINATED",
  "RETIRED",
  "CONTRACT_ENDED",
] as const;
