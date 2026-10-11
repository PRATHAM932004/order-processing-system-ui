"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserFormSchema,
  CreateUserFormValues,
} from "@/lib/validations/order-schema";
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
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/order/kpi-card";
import {
  useGetCustomersQuery,
  useCreateUserMutation,
  useUpdateUserRoleMutation,
} from "@/store/api/order-api";
import { useAppSelector } from "@/store";
import { Customer, UserRole } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Boxes,
  ShoppingBag,
  RefreshCw,
  Search,
  AlertTriangle,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { toast } from "sonner";

const PRIMARY_ADMIN_EMAIL = "admin@order.com";

const ROLE_OPTIONS: Array<{
  value: UserRole;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "INVENTORY_MANAGER",
    label: "Inventory Manager",
    shortLabel: "INV_MGR",
    description:
      "Can manage product catalog, adjust warehouse stock levels, and audit order.inventory reservations.",
  },
  {
    value: "ADMIN",
    label: "Administrator",
    shortLabel: "ADMIN",
    description:
      "Full access to all customer orders, inventory catalog, user & role management, and Kafka telemetry.",
  },
  {
    value: "CUSTOMER",
    label: "Customer",
    shortLabel: "CUSTOMER",
    description:
      "Can place new orders, view own order lifecycle, and track own order events.",
  },
];

export default function AdminUsersPage() {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
    isFetching: isFetchingCustomers,
    refetch: refetchCustomers,
  } = useGetCustomersQuery(undefined, {
    skip: !isAdmin,
    pollingInterval: 10000,
  });

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUserRole] = useUpdateUserRoleMutation();

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "password123",
      role: "INVENTORY_MANAGER",
    },
  });

  const { handleSubmit, reset, setValue, watch } = form;
  const selectedRole = watch("role");

  const onSubmit = async (values: CreateUserFormValues) => {
    try {
      const created = await createUser(values).unwrap();
      toast.success(
        `Created ${created.role} account for ${created.name} (${created.email})`
      );
      reset({
        name: "",
        email: "",
        password: "password123",
        role: values.role,
      });
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string; message?: string } })?.data?.error ||
        (err as { data?: { error?: string; message?: string } })?.data
          ?.message ||
        "Failed to create user account";
      toast.error(msg);
    }
  };

  const handleRoleChange = async (targetUser: Customer, newRole: UserRole) => {
    const currentRole = (targetUser.role || "CUSTOMER") as UserRole;
    if (currentRole === newRole) return;

    if (
      targetUser.email.toLowerCase() === PRIMARY_ADMIN_EMAIL &&
      newRole !== "ADMIN"
    ) {
      toast.error(
        "Cannot demote the primary system administrator (admin@order.com)"
      );
      return;
    }

    setUpdatingUserId(targetUser.id);
    try {
      await updateUserRole({
        id: targetUser.id,
        role: newRole,
      }).unwrap();
      toast.success(
        `Updated role for ${targetUser.name}: ${currentRole} → ${newRole}`
      );
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string; message?: string } })?.data?.error ||
        (err as { data?: { error?: string; message?: string } })?.data
          ?.message ||
        "Failed to update user role";
      toast.error(msg);
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!isAdmin) {
    return (
      <Card className="p-8 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
        <h2 className="text-lg font-semibold text-foreground">
          Administrator Access Required
        </h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Only users with the <code className="font-mono">ADMIN</code> role can
          list all accounts in <code className="font-mono">CustomerRepository</code>,
          provision staff users, or modify RBAC roles.
        </p>
      </Card>
    );
  }

  // KPI metrics
  const totalAccounts = customers.length;
  const adminCount = customers.filter(
    (c) => (c.role || "CUSTOMER") === "ADMIN"
  ).length;
  const inventoryManagerCount = customers.filter(
    (c) => (c.role || "CUSTOMER") === "INVENTORY_MANAGER"
  ).length;
  const customerCount = customers.filter(
    (c) => (c.role || "CUSTOMER") === "CUSTOMER"
  ).length;

  const filteredCustomers = customers.filter((c) => {
    const normalizedRole = (c.role || "CUSTOMER") as UserRole;
    const matchesRole = roleFilter === "ALL" || normalizedRole === roleFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const activeRoleMeta =
    ROLE_OPTIONS.find((r) => r.value === selectedRole) || ROLE_OPTIONS[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/50">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
              User &amp; Role Management
            </h1>
            <Badge variant="confirmed" className="text-xs font-mono shrink-0">
              Role: {currentUser?.role}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Manage all registered accounts in{" "}
            <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">
              CustomerRepository
            </code>
            , create new staff users, and switch roles (
            <code className="font-mono text-[11px]">
              CUSTOMER ↔ INVENTORY_MANAGER ↔ ADMIN
            </code>
            ).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchCustomers();
              toast.success("Synchronized accounts from PostgreSQL");
            }}
            disabled={isFetchingCustomers}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isFetchingCustomers ? "animate-spin" : ""
              }`}
            />
            Sync Accounts
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <Link href="/inventory">
              <Boxes className="h-3.5 w-3.5 text-primary" />
              Inventory Console
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Registered Accounts"
          value={totalAccounts.toString()}
          subtext="Rows in customers table"
          badge="CustomerRepository"
          badgeVariant="neutral"
        />

        <KpiCard
          label="Administrators"
          value={adminCount.toString()}
          subtext="Full platform & RBAC control"
          badge="ADMIN"
          badgeVariant="success"
          colorClass="text-emerald-600 dark:text-emerald-400"
        />

        <KpiCard
          label="Inventory Managers"
          value={inventoryManagerCount.toString()}
          subtext="Catalog & stock operations"
          badge="INVENTORY_MANAGER"
          badgeVariant="warning"
          colorClass="text-amber-600 dark:text-amber-400"
        />

        <KpiCard
          label="Customer Accounts"
          value={customerCount.toString()}
          subtext="Self-service order portal"
          badge="CUSTOMER"
          badgeVariant="default"
        />
      </div>

      {/* Main Grid: Left (Create Staff / User Form) + Right (Accounts Directory & Role Switcher) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Create Staff / User Account Card */}
        <Card className="lg:col-span-4 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Create Staff / User Account
              </h2>
            </div>
            <Badge variant="subtle" className="text-[10px] font-mono">
              BCrypt Auth
            </Badge>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Role Selector Pills */}
              <FormField
                control={form.control}
                name="role"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-xs">Assigned Role</FormLabel>
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      {ROLE_OPTIONS.map((option) => {
                        const isSelected = selectedRole === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setValue("role", option.value, {
                                shouldValidate: true,
                              })
                            }
                            className={`px-2 py-2 rounded-lg text-[11px] font-mono font-semibold border transition-colors text-center ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {option.shortLabel}
                          </button>
                        );
                      })}
                    </div>
                    <div className="rounded-lg bg-muted/50 border border-border/50 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground block mb-0.5">
                        {activeRoleMeta.label} Permissions:
                      </span>
                      {activeRoleMeta.description}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="e.g. Priya Sharma"
                          className="pl-8 h-9 text-xs"
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
                        <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="e.g. priya.inventory@order.com"
                          className="pl-8 h-9 text-xs"
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
                    <FormLabel className="text-xs">Initial Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Minimum 6 characters"
                          className="pl-8 h-9 text-xs font-mono"
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
                disabled={isCreating}
                className="w-full h-9 text-xs font-semibold bg-primary hover:bg-primary-hover text-white gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {isCreating
                  ? "Creating Account..."
                  : `Create ${activeRoleMeta.shortLabel} Account`}
              </Button>
            </form>
          </Form>
        </Card>

        {/* Registered Accounts Directory & Role Switcher */}
        <Card className="lg:col-span-8 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>
                  CustomerRepository Accounts ({filteredCustomers.length})
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Switch any account between{" "}
                <code className="font-mono">CUSTOMER</code>,{" "}
                <code className="font-mono">INVENTORY_MANAGER</code>, and{" "}
                <code className="font-mono">ADMIN</code>
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search name, email, or UUID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              ["ALL", "ADMIN", "INVENTORY_MANAGER", "CUSTOMER"] as const
            ).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium transition-colors ${
                  roleFilter === role
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {role === "ALL" ? "All Roles" : role}
              </button>
            ))}
          </div>

          {isLoadingCustomers ? (
            <div className="py-12 text-center text-xs text-muted-foreground font-mono">
              Loading registered accounts from PostgreSQL...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center space-y-2 border rounded-xl border-dashed">
              <p className="text-xs font-medium text-foreground">
                No matching user accounts found
              </p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Try clearing your search filter or use the form on the left to
                provision a new account.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3">Current Role</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">
                      Change Role (CUSTOMER ↔ INV_MGR ↔ ADMIN)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredCustomers.map((account) => {
                    const role = (account.role || "CUSTOMER") as UserRole;
                    const isPrimaryAdmin =
                      account.email.toLowerCase() === PRIMARY_ADMIN_EMAIL;
                    const isSelf = currentUser?.id === account.id;
                    const isRowUpdating = updatingUserId === account.id;

                    return (
                      <tr
                        key={account.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                              {account.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-foreground truncate">
                                  {account.name}
                                </span>
                                {isSelf && (
                                  <Badge
                                    variant="subtle"
                                    className="text-[9px] px-1.5 py-0 font-mono"
                                  >
                                    You
                                  </Badge>
                                )}
                                {isPrimaryAdmin && (
                                  <Badge
                                    variant="confirmed"
                                    className="text-[9px] px-1.5 py-0 font-mono"
                                  >
                                    System Admin
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                {account.email}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground/80">
                                #{account.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              role === "ADMIN"
                                ? "confirmed"
                                : role === "INVENTORY_MANAGER"
                                ? "pending"
                                : "subtle"
                            }
                            className="text-[10px] font-mono gap-1"
                          >
                            {role === "ADMIN" ? (
                              <ShieldCheck className="h-3 w-3" />
                            ) : role === "INVENTORY_MANAGER" ? (
                              <Boxes className="h-3 w-3" />
                            ) : (
                              <ShoppingBag className="h-3 w-3" />
                            )}
                            {role}
                          </Badge>
                        </td>

                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                          {account.createdAt
                            ? formatRelativeTime(account.createdAt)
                            : "Seeded"}
                        </td>

                        <td className="py-3 px-3 text-right">
                          {isPrimaryAdmin ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground px-2 py-1 rounded bg-muted/50 border border-border/50"
                              title="Primary administrator account cannot be demoted"
                            >
                              <Lock className="h-3 w-3 text-emerald-500" />
                              Protected ADMIN
                            </span>
                          ) : (
                            <div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-0.5 gap-0.5">
                              {ROLE_OPTIONS.map((opt) => {
                                const active = role === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    disabled={isRowUpdating || active}
                                    onClick={() =>
                                      handleRoleChange(account, opt.value)
                                    }
                                    className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold transition-colors ${
                                      active
                                        ? opt.value === "ADMIN"
                                          ? "bg-emerald-600 text-white"
                                          : opt.value === "INVENTORY_MANAGER"
                                          ? "bg-amber-500 text-white"
                                          : "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background"
                                    } disabled:cursor-default`}
                                    title={`Set role to ${opt.value}`}
                                  >
                                    {opt.shortLabel}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
