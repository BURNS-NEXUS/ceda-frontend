"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Link } from "@/i18n/navigation";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { signInSchema, type SignInFormData } from "./schema";
import { useRouter } from "@/i18n/navigation";
import type { DemoRole } from "@/layout/app-layout/sidebar/data";
import { ApiError, login } from "@/lib/api/client";

const demoAccounts: { role: DemoRole; label: string; email: string; password: string }[] = [
  { role: "innovator", label: "Innovator portal", email: "innovator@burnz.demo", password: "Demo123!" },
  { role: "evaluator", label: "Evaluator portal", email: "evaluator@burnz.demo", password: "Demo123!" },
  { role: "programmeAdmin", label: "Programme admin", email: "admin@burnz.demo", password: "Demo123!" },
  { role: "adjudicator", label: "Adjudicator workspace", email: "adjudicator@burnz.demo", password: "Demo123!" },
];

export default function SignInFormFields() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<DemoRole>("innovator");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    setValue,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      keepLoggedIn: false,
    },
    mode: "onTouched",
  });

  const handleFormSubmit = async (data: SignInFormData) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const account = demoAccounts.find((candidate) => candidate.email === normalizedEmail);
    setSubmitError(null);

    // Demo mode must remain usable while the remote Django service is HTTP-only
    // or unavailable from an HTTPS Vercel deployment.
    if (account && data.password === account.password) {
      window.localStorage.setItem("burnz-demo-auth", "authenticated");
      window.localStorage.setItem("burnz-demo-role", account.role);
      router.push("/");
      return;
    }

    try {
      await login(normalizedEmail, data.password);
      window.localStorage.setItem("burnz-demo-auth", "authenticated");
      window.localStorage.setItem("burnz-demo-role", account?.role ?? role);
    } catch (caught) {
      setSubmitError(
        caught instanceof ApiError && caught.status === 401
          ? "The email or password is incorrect."
          : "The backend is unavailable. Check the connection and try again.",
      );
      return;
    }
    router.push("/");
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-5"
      noValidate
    >
      <Field data-invalid={Boolean(errors.email)}>
        <FieldLabel className="mb-1.5 block">
          Email <span className="text-red-500">*</span>
        </FieldLabel>
        <Input
          {...register("email")}
          type="email"
          placeholder="info@gmail.com"
          aria-invalid={errors.email ? "true" : undefined}
        />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field data-invalid={Boolean(errors.password)}>
        <FieldLabel className="mb-1.5 block">
          Password <span className="text-red-500">*</span>
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            aria-invalid={errors.password ? "true" : undefined}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-gray-500 dark:text-gray-400"
            >
              {showPassword ? (
                <EyeIcon className="text-current" />
              ) : (
                <EyeCloseIcon className="text-current" />
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <FieldError errors={[errors.password]} />
      </Field>

      <Field>
        <FieldLabel className="mb-1.5 block">Portal</FieldLabel>
        <div className="rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2.5 text-sm font-medium text-brand-700 dark:border-brand-900/50 dark:bg-brand-900/20 dark:text-brand-300">{demoAccounts.find((account) => account.role === role)?.label}</div>
        <p className="mt-1.5 text-xs text-gray-500">Choose a seeded demo account below. Its role is applied automatically.</p>
      </Field>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {demoAccounts.map((account) => <button type="button" key={account.role} onClick={() => { setRole(account.role); setValue("email", account.email); setValue("password", account.password); }} className={`rounded-lg border p-3 text-left transition-colors ${role === account.role ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/20" : "border-gray-200 hover:border-brand-300 dark:border-gray-700"}`}><div className="text-xs font-semibold text-gray-800 dark:text-white/90">{account.label}</div><div className="mt-1 text-[11px] text-gray-500">{account.email}</div></button>)}
      </div>

      <div className="flex items-center justify-between">
        <Field orientation="horizontal" className="w-auto items-center gap-3">
          <Controller
            control={control}
            name="keepLoggedIn"
            render={({ field }) => (
              <Checkbox
                id="keep-logged-in"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
              />
            )}
          />
          <FieldLabel
            htmlFor="keep-logged-in"
            className="text-theme-sm block cursor-pointer font-normal text-gray-700 dark:text-gray-400"
          >
            Keep me logged in
          </FieldLabel>
        </Field>
        <Link
          href="/reset-password"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          Forgot password?
        </Link>
      </div>

      <div>
        {submitError ? <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p> : null}
        <Button
          className="w-full"
          size="lg"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </Button>
      </div>
    </form>
  );
}

