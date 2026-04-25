"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

export interface Profile {
  id: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn?: string;
  lastNameEn?: string;
  phone?: string;
  employmentStatus: string;
  nicknameTh?: string;
  nicknameEn?: string;
  dateOfBirth?: string;
  nationality?: string;
  religion?: string;
  maritalStatus?: string;
  bloodType?: string;
  bankName?: string;
  bankAccount?: string;
  addressCurrent?: string;
  provinceCurrent?: string;
  districtCurrent?: string;
  zipCodeCurrent?: string;
  emergencyName?: string;
  emergencyLastName?: string;
  emergencyRelation?: string;
  emergencyPhone?: string;
  department?: { name: string; code: string };
  position?: { name: string };
  user?: { email: string };
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Profile>("/api/v1/employee/me/profile")
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"))
      .finally(() => setIsLoading(false));
  }, []);

  const updateProfile = useCallback(
    async (input: Partial<Omit<Profile, "id" | "employeeCode" | "employmentStatus" | "department" | "position" | "user">>) => {
      const updated = await apiFetch<Profile>("/api/v1/employee/me/profile", {
        method: "PUT",
        body: JSON.stringify(input),
      });
      setProfile(updated);
      return updated;
    },
    [],
  );

  return { profile, isLoading, error, updateProfile };
}
