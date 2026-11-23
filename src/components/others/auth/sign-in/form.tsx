"use client";

import { errorMessage } from "@/components/burnz/ui/async-state";
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
import { ApiError, getMyPermissions, login } from "@/lib/api/client";
import { roleFromPermissions } from "@/lib/burnz/role-from-permissions";

export default function SignInFormFields() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
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
    setSubmitError(null);

    try {
      const authenticatedUser = await login(normalizedEmail, data.password);
      // Resolve the real role from the API's granted permissions so newly
      // registered customers and seeded staff all land in the right portal.
      const permissions = await getMyPermissions().catch(() => null);
      window.localStorage.setItem("burnz-demo-auth", "authenticated");
      window.localStorage.setItem(
        "burnz-demo-role",
        roleFromPermissions(permissions),
      );
      window.localStorage.setItem("ceda-auth-user", JSON.stringify(authenticatedUser));
    } catch (caught) {
      setSubmitError(
        caught instanceof ApiError && caught.status === 401
          ? "The email or password is incorrect."
          : errorMessage(caught),
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

