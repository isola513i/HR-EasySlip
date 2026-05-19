"use client";

import { useState, useCallback } from "react";

export function useFieldErrors<T extends string>() {
  const [errors, setErrors] = useState<Partial<Record<T, string>>>({});

  const clearField = useCallback((field: T) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setFieldErrors = useCallback((newErrors: Partial<Record<T, string>>) => {
    setErrors(newErrors);
  }, []);

  return { errors, clearField, setFieldErrors };
}
