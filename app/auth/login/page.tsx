"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginFormSchema, LoginFormValues } from "@/lib/validations/order-schema";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers, Lock, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLoginMutation } from "@/store/api/order-api";
import { useAppDispatch } from "@/store";
import { setCredentials } from "@/store/auth-slice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading: loading }] = useLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "alice@example.com",
      password: "password123",
      role: "CUSTOMER",
      rememberMe: true,
    },
  });

  const { handleSubmit, setValue } = form;

  const quickFill = (
    email: string,
    role: "OPERATOR" | "ADMIN" | "CUSTOMER",
    label: string
  ) => {
    setValue("email", email);
    setValue("password", "password123");
    setValue("role", role);
    toast.info(`Filled credentials for ${label}: ${email}`);
  };

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await login({
        email: values.email,
        password: values.password,
      }).unwrap();
      dispatch(setCredentials(response));
      toast.success(
        `Signed in as ${response.user.name} (${response.user.role})`
      );
      router.push("/");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Invalid email or password";
      toast.error(msg);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm">
          <Layers className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
          Sign In to OrderFlow
        </h1>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Authenticate with the Spring Boot backend to place and monitor orders
        </p>
      </div>

      <Card className="p-6 space-y-5">
        {/* Quick Demo Fill Buttons */}
        <div className="space-y-2 pb-4 border-b border-border/60">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            Seeded PostgreSQL Accounts (Password: password123):
          </span>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                quickFill("alice@example.com", "CUSTOMER", "Customer (Alice)")
              }
              className="px-2 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-[11px] font-medium text-foreground transition-colors"
            >
              Alice (Customer)
            </button>
            <button
              type="button"
              onClick={() =>
                quickFill("bob@example.com", "CUSTOMER", "Customer (Bob - Fail Test)")
              }
              className="px-2 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-[11px] font-medium text-foreground transition-colors"
            >
              Bob (Pay Fail)
            </button>
            <button
              type="button"
              onClick={() =>
                quickFill("asha.mehta@example.com", "ADMIN", "Admin (Asha Mehta)")
              }
              className="px-2 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-[11px] font-medium text-foreground transition-colors"
            >
              Asha (Admin)
            </button>
          </div>
        </div>

        {/* Login Form with FormProvider */}
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Work Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        className="pl-9 h-9 text-xs"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs">Password</FormLabel>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Default: password123
                    </span>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-9 h-9 text-xs"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    Remember session on this device
                  </label>
                </div>
              )}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-none mt-2"
            >
              {loading ? "Authenticating with Backend..." : "Sign In to Console →"}
            </Button>
          </form>
        </Form>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-primary hover:underline"
          >
            Register new customer profile
          </Link>
        </div>
      </Card>
    </div>
  );
}
