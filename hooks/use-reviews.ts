"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

export type ReviewCadence = "QUARTERLY" | "ANNUAL";
export type ReviewCycleStatus = "DRAFT" | "ACTIVE" | "CLOSED";
export type ReviewType = "SELF" | "MANAGER" | "PEER";
export type ReviewStatus = "DRAFT" | "SUBMITTED" | "ACKNOWLEDGED";

export interface ReviewQuestion {
  key: string;
  label: string;
  type: "scale" | "text";
  required?: boolean;
}

export interface ReviewTemplate {
  id: string;
  name: string;
  questions: ReviewQuestion[];
  createdAt: string;
}

export interface ReviewCycleSummary {
  id: string;
  name: string;
  cadence: ReviewCadence;
  startDate: string;
  endDate: string;
  status: ReviewCycleStatus;
  template: { id: string; name: string } | null;
  _count: { reviews: number };
}

export interface MyReviewItem {
  id: string;
  reviewType: ReviewType;
  status: ReviewStatus;
  cycle: { id: string; name: string; cadence: ReviewCadence; endDate: string; templateId: string | null };
  reviewee: { id: string; employeeCode: string; firstNameTh: string; lastNameTh: string };
}

export interface ReviewDetail {
  id: string;
  cycleId: string;
  reviewType: ReviewType;
  status: ReviewStatus;
  answers: Record<string, string | number> | null;
  overallRating: number | null;
  comments: string | null;
  submittedAt: string | null;
  cycle: ReviewCycleSummary & { template: ReviewTemplate | null };
  reviewee: { id: string; employeeCode: string; firstNameTh: string; lastNameTh: string };
  reviewer: { id: string; employeeCode: string; firstNameTh: string; lastNameTh: string };
}

export function useMyReviews() {
  const [items, setItems] = useState<MyReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<MyReviewItem[]>("/api/v1/reviews/me");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { items, isLoading, error, refetch };
}

export function useReviewCycles() {
  const [items, setItems] = useState<ReviewCycleSummary[]>([]);
  const [templates, setTemplates] = useState<ReviewTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cycles, tmpls] = await Promise.all([
        apiFetch<ReviewCycleSummary[]>("/api/v1/hr/reviews/cycles"),
        apiFetch<ReviewTemplate[]>("/api/v1/hr/reviews/templates"),
      ]);
      setItems(cycles);
      setTemplates(tmpls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const activate = useCallback(async (id: string) => {
    await apiFetch(`/api/v1/hr/reviews/cycles/${id}/activate`, { method: "POST" });
    await refetch();
  }, [refetch]);

  const close = useCallback(async (id: string) => {
    await apiFetch(`/api/v1/hr/reviews/cycles/${id}/close`, { method: "POST" });
    await refetch();
  }, [refetch]);

  const createTemplate = useCallback(async (input: { name: string; questions: ReviewQuestion[] }) => {
    await apiFetch("/api/v1/hr/reviews/templates", { method: "POST", body: JSON.stringify(input) });
    await refetch();
  }, [refetch]);

  const createCycle = useCallback(async (input: {
    name: string; cadence: ReviewCadence; startDate: string; endDate: string; templateId: string;
  }) => {
    await apiFetch("/api/v1/hr/reviews/cycles", { method: "POST", body: JSON.stringify(input) });
    await refetch();
  }, [refetch]);

  return { items, templates, isLoading, error, refetch, activate, close, createTemplate, createCycle };
}
