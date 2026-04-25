import { z } from "zod";

export const ProfileUpdateSchema = z.object({
  // Basic
  phone: z.string().max(20).optional(),
  firstNameEn: z.string().max(100).optional(),
  lastNameEn: z.string().max(100).optional(),
  nicknameTh: z.string().max(50).optional(),
  nicknameEn: z.string().max(50).optional(),
  personalEmail: z.string().email().optional(),
  lineId: z.string().max(50).optional(),
  // Personal
  dateOfBirth: z.string().max(10).optional(),
  nationality: z.string().max(100).optional(),
  religion: z.string().max(50).optional(),
  maritalStatus: z.string().max(30).optional(),
  bloodType: z.string().max(5).optional(),
  // Financial
  bankName: z.string().max(100).optional(),
  bankAccount: z.string().max(30).optional(),
  // Address
  addressCurrent: z.string().max(500).optional(),
  provinceCurrent: z.string().max(100).optional(),
  districtCurrent: z.string().max(100).optional(),
  subdistrictCurrent: z.string().max(100).optional(),
  zipCodeCurrent: z.string().max(10).optional(),
  // Emergency
  emergencyName: z.string().max(100).optional(),
  emergencyLastName: z.string().max(100).optional(),
  emergencyRelation: z.string().max(50).optional(),
  emergencyPhone: z.string().max(20).optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
