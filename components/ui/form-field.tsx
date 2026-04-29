"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";

export function FormRoot({
  className,
  noValidate = true,
  ...props
}: React.ComponentProps<typeof Form>) {
  return <Form className={className} noValidate={noValidate} {...props} />;
}

export function FormField({
  className,
  ...props
}: React.ComponentProps<typeof Field.Root>) {
  return (
    <Field.Root className={cn("space-y-2", className)} {...props} />
  );
}

interface FormFieldErrorProps {
  inputType?: "email" | "url" | (string & {});
  minLength?: number;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  className?: string;
}

const interpolate = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`,
  );

const stripPlaceholder = (text: string, placeholder: string) =>
  text.replace(new RegExp(`\\s*\\{${placeholder}\\}\\s*`), " ").trim();

export function FormFieldError({
  inputType,
  minLength,
  maxLength,
  min,
  max,
  className,
}: FormFieldErrorProps) {
  const t = useT();
  const v = t.validation;

  const errorClass = cn(
    "mt-1 flex items-center gap-1.5 text-xs text-destructive",
    className,
  );
  const icon = (
    <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
  );

  const typeMismatchMsg =
    inputType === "email"
      ? v.typeMismatchEmail
      : inputType === "url"
        ? v.typeMismatchUrl
        : v.typeMismatch;

  const tooShortMsg =
    minLength != null
      ? interpolate(v.tooShort, { min: minLength })
      : stripPlaceholder(v.tooShort, "min");
  const tooLongMsg =
    maxLength != null
      ? interpolate(v.tooLong, { max: maxLength })
      : stripPlaceholder(v.tooLong, "max");
  const rangeUnderflowMsg =
    min != null
      ? interpolate(v.rangeUnderflow, { min: String(min) })
      : stripPlaceholder(v.rangeUnderflow, "min");
  const rangeOverflowMsg =
    max != null
      ? interpolate(v.rangeOverflow, { max: String(max) })
      : stripPlaceholder(v.rangeOverflow, "max");

  return (
    <>
      <Field.Error match="valueMissing" className={errorClass}>
        {icon}
        <span>{v.valueMissing}</span>
      </Field.Error>
      <Field.Error match="typeMismatch" className={errorClass}>
        {icon}
        <span>{typeMismatchMsg}</span>
      </Field.Error>
      <Field.Error match="tooShort" className={errorClass}>
        {icon}
        <span>{tooShortMsg}</span>
      </Field.Error>
      <Field.Error match="tooLong" className={errorClass}>
        {icon}
        <span>{tooLongMsg}</span>
      </Field.Error>
      <Field.Error match="patternMismatch" className={errorClass}>
        {icon}
        <span>{v.patternMismatch}</span>
      </Field.Error>
      <Field.Error match="rangeUnderflow" className={errorClass}>
        {icon}
        <span>{rangeUnderflowMsg}</span>
      </Field.Error>
      <Field.Error match="rangeOverflow" className={errorClass}>
        {icon}
        <span>{rangeOverflowMsg}</span>
      </Field.Error>
      <Field.Error match="stepMismatch" className={errorClass}>
        {icon}
        <span>{v.stepMismatch}</span>
      </Field.Error>
      <Field.Error match="badInput" className={errorClass}>
        {icon}
        <span>{v.badInput}</span>
      </Field.Error>
    </>
  );
}

export function FormFieldDescription({
  className,
  ...props
}: React.ComponentProps<typeof Field.Description>) {
  return (
    <Field.Description
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}
