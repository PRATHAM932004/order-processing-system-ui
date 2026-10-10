"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerFormSchema, RegisterFormValues } from "@/lib/validations/order-schema";
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
import { Layers, Building, User, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useRegisterMutation } from "@/store/api/order-api";
import { useAppDispatch } from "@/store";
import { setCredentials } from "@/store/auth-slice";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [registerAccount, { isLoading: loading }] = useRegisterMutation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      organization: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { handleSubmit } = form;

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const response = await registerAccount({
        name: values.name,
        email: values.email,
        password: values.password,
      }).unwrap();
      dispatch(setCredentials(response));
      toast.success(
        `Account registered & signed in as ${response.user.name} (${response.user.role})`
      );
      router.push("/");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Registration failed. Email may already be registered.";
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
          Create OrderFlow Account
        </h1>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Register a customer profile in PostgreSQL to place and track your orders
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. Priya Nair"
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
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Organization / Company</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. Enterprise Logistics Corp"
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
                  <FormLabel className="text-xs">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="At least 8 characters"
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
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Repeat your password"
                        className="pl-9 h-9 text-xs"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-none mt-2"
            >
              {loading ? "Registering Account..." : "Create Customer Account →"}
            </Button>
          </form>
        </Form>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Already registered?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in to existing account
          </Link>
        </div>
      </Card>
    </div>
  );
}
