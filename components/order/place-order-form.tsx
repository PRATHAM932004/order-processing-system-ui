"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createOrderFormSchema,
  CreateOrderFormValues,
} from "@/lib/validations/order-schema";
import { Form } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import { Product, Customer } from "@/lib/types";
import {
  useCreateOrderMutation,
  useGetProductsQuery,
  useGetCustomersQuery,
} from "@/store/api/order-api";
import { useAppSelector } from "@/store";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Zap,
  ShoppingBag,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function PlaceOrderForm() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const { data: products = [], isLoading: isLoadingProducts } =
    useGetProductsQuery();
  const { data: customers = [], isLoading: isLoadingCustomers } =
    useGetCustomersQuery(undefined, {
      skip: !isAdmin,
    });

  const [createOrder, { isLoading: isSubmitting }] = useCreateOrderMutation();

  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [showPayload, setShowPayload] = useState(false);
  const initializedItemsRef = useRef(false);

  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderFormSchema),
    defaultValues: {
      customerId: user?.id || "",
      customerName: user?.name || "",
      customerEmail: user?.email || "",
      paymentMethod: "UPI",
      deliveryNotes: "Priority Delivery via Kafka Event Pipeline",
      items: [],
    },
  });

  const { control, handleSubmit, watch, setValue, reset } = form;
  const { append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const watchedCustomerId = watch("customerId");
  const watchedPaymentMethod = watch("paymentMethod");
  const watchedItems = watch("items") || [];

  // Keep customerId bound to self for normal CUSTOMER role, or default to first customer for ADMIN
  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      setValue("customerId", user.id, { shouldValidate: true });
      setValue("customerName", user.name);
      setValue("customerEmail", user.email);
    } else if (isAdmin && !watchedCustomerId && customers.length > 0) {
      const firstCustomer =
        customers.find((c) => c.role === "CUSTOMER") || customers[0];
      setValue("customerId", firstCustomer.id, { shouldValidate: true });
      setValue("customerName", firstCustomer.name);
      setValue("customerEmail", firstCustomer.email);
    }
  }, [user, isAdmin, customers, watchedCustomerId, setValue]);

  // Seed 1 initial catalog item once products are fetched from backend
  useEffect(() => {
    if (!initializedItemsRef.current && products.length > 0 && watchedItems.length === 0) {
      initializedItemsRef.current = true;
      const firstInStock = products.find((p) => p.stockQuantity > 0) || products[0];
      if (firstInStock) {
        setValue("items", [
          {
            productId: firstInStock.id,
            productName: firstInStock.name,
            sku: firstInStock.sku,
            unitPrice: Number(firstInStock.price),
            quantity: 1,
            lineTotal: Number(firstInStock.price),
          },
        ]);
      }
    }
  }, [products, watchedItems.length, setValue]);

  const selectedCustomer = isAdmin
    ? customers.find((c) => c.id === watchedCustomerId)
    : user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    : undefined;

  // Compute available categories dynamically from backend products
  const categories = [
    "ALL",
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
  ];

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      categoryFilter === "ALL" || prod.category === categoryFilter;
    const matchesSearch =
      prod.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (prod.sku && prod.sku.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Calculate totals
  const subtotal = watchedItems.reduce(
    (acc, curr) => acc + (Number(curr.lineTotal) || 0),
    0
  );
  const grandTotal = subtotal;

  const handleCustomerChange = (customer: Customer) => {
    if (!isAdmin) return;
    setValue("customerId", customer.id, { shouldValidate: true });
    setValue("customerName", customer.name);
    setValue("customerEmail", customer.email);
  };

  const handleProductAdd = (product: Product) => {
    const price = Number(product.price);
    const existingIndex = watchedItems.findIndex(
      (i) => i.productId === product.id
    );
    if (existingIndex >= 0) {
      const existing = watchedItems[existingIndex];
      const newQty = existing.quantity + 1;
      update(existingIndex, {
        ...existing,
        quantity: newQty,
        lineTotal: price * newQty,
      });
    } else {
      append({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPrice: price,
        quantity: 1,
        lineTotal: price,
      });
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    const index = watchedItems.findIndex((i) => i.productId === productId);
    if (index === -1) return;

    const current = watchedItems[index];
    const newQty = current.quantity + delta;

    if (newQty <= 0) {
      remove(index);
    } else {
      update(index, {
        ...current,
        quantity: newQty,
        lineTotal: Number(current.unitPrice) * newQty,
      });
    }
  };

  const onSubmit = async (values: CreateOrderFormValues) => {
    try {
      const targetCustomerId = isAdmin ? values.customerId : user?.id;
      if (!targetCustomerId) {
        toast.error("You must be signed in to place an order.");
        router.push("/auth/login");
        return;
      }

      const payload = {
        customerId: targetCustomerId,
        paymentMethod: values.paymentMethod,
        items: values.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      toast.loading("Publishing order to Kafka topic (order.created)...", {
        id: "order-submit",
      });
      const newOrder = await createOrder(payload).unwrap();
      toast.success(
        `Order #${newOrder.id.substring(0, 8)} placed! Dispatched to Kafka topic order.created`,
        { id: "order-submit" }
      );
      router.push(`/orders/${newOrder.id}`);
    } catch (err: unknown) {
      const errorMessage =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to place order. Verify backend is running and you are authenticated.";
      toast.error(errorMessage, {
        id: "order-submit",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Main Content Area ~ 65-70%) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section A: Role-Based Customer Identity / Admin Customer Selection */}
            {isAdmin ? (
              <Card className="p-4 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/60">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                      <span>Admin Mode: Select Customer Account</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      As an Administrator, you can dispatch an order on behalf of any registered customer
                    </p>
                  </div>
                  <Badge
                    variant="subtle"
                    className="self-start sm:self-auto font-mono text-[11px] shrink-0"
                  >
                    ADMIN PRIVILEGE
                  </Badge>
                </div>

                {isLoadingCustomers ? (
                  <div className="py-6 text-center text-xs text-muted-foreground font-mono">
                    Loading customers from GET /api/customers...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">
                      Select Registered Customer ({customers.length} accounts in PostgreSQL):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {customers.map((cust) => {
                        const isSelected = cust.id === watchedCustomerId;
                        return (
                          <div
                            key={cust.id}
                            onClick={() => handleCustomerChange(cust)}
                            className={`cursor-pointer p-3 rounded-lg border text-xs transition-all ${
                              isSelected
                                ? "border-primary bg-primary-subtle ring-1 ring-primary/40 text-foreground"
                                : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">
                                  {cust.name[0]}
                                </div>
                                <span className="font-semibold text-foreground truncate">
                                  {cust.name}
                                </span>
                              </div>
                              {cust.role === "ADMIN" && (
                                <Badge variant="subtle" className="text-[9px] px-1 py-0 shrink-0">
                                  ADMIN
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-1">
                              {cust.email}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedCustomer && (
                  <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {selectedCustomer.name}
                        </span>
                        <Badge variant="confirmed" className="text-[10px] py-0 px-1.5 shrink-0">
                          {selectedCustomer.role || "CUSTOMER"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        {selectedCustomer.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
                      <div>
                        <span>Customer UUID: </span>
                        <span className="font-semibold text-foreground">
                          {selectedCustomer.id}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              /* Normal Customer: Read-Only Self Identity Banner (No Customer Selection UI) */
              <Card className="p-4 sm:p-5 border-primary/25 bg-primary/5 dark:bg-primary/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-foreground">
                          Ordering for Self: {user?.name || "Authenticated Customer"}
                        </span>
                        <Badge
                          variant="confirmed"
                          className="text-[10px] py-0 px-2 shrink-0"
                        >
                          Self-Order Locked
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground/80">
                          {user?.email}
                        </span>{" "}
                        • Automatically bound to your authenticated account
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end pt-2.5 sm:pt-0 border-t sm:border-t-0 border-primary/15 shrink-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium sm:hidden">
                      Customer Key
                    </span>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-background/90 px-2.5 py-1 rounded-lg border border-border/70">
                      <Lock className="h-3 w-3 text-primary shrink-0" />
                      <span>
                        ID: {user?.id ? `${user.id.substring(0, 8)}...` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Section B: Product Catalog / Picker */}
            <Card className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary shrink-0" />
                    <span>Product Catalog &amp; Live PostgreSQL Stock</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Select products from the live backend catalog. Stock is reserved asynchronously via the{" "}
                    <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">
                      order.created
                    </code>{" "}
                    Kafka consumer.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search products by name or SKU..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-8 h-8 text-xs w-full sm:w-60"
                    />
                  </div>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      categoryFilter === cat
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat === "ALL" ? "All Items" : cat}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              {isLoadingProducts ? (
                <div className="py-12 text-center text-xs text-muted-foreground font-mono">
                  Fetching live product catalog from GET /api/products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground border rounded-xl border-dashed">
                  No matching products found in backend catalog.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map((prod) => {
                    const inCartItem = watchedItems.find(
                      (i) => i.productId === prod.id
                    );
                    const threshold = prod.lowStockThreshold ?? 5;
                    const isLowStock = prod.stockQuantity <= threshold;

                    return (
                      <div
                        key={prod.id}
                        className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                          inCartItem
                            ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                            : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-xs text-foreground line-clamp-1">
                              {prod.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                              {prod.category}
                            </span>
                          </div>

                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 min-h-[32px]">
                            {prod.description || `SKU: ${prod.sku || prod.id.substring(0, 8)}`}
                          </p>

                          <div className="mt-3 flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground font-sans tabular-nums text-sm">
                              {formatINR(Number(prod.price))}
                            </span>

                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                isLowStock
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              }`}
                            >
                              {isLowStock
                                ? `Low stock: ${prod.stockQuantity} left`
                                : `${prod.stockQuantity} in stock`}
                            </span>
                          </div>
                        </div>

                        {/* Quantity or Add Button */}
                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                          {inCartItem ? (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-semibold text-primary">
                                In Order:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleQuantityChange(prod.id, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-mono text-xs font-semibold px-2 tabular-nums">
                                  {inCartItem.quantity}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleQuantityChange(prod.id, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleProductAdd(prod)}
                              className="w-full h-8 text-xs font-medium gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add to Order
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Sticky Order Summary Panel (~30-35%) */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <Card className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-base font-semibold text-foreground">
                  Order Summary
                </h3>
                <Badge variant="subtle" className="text-xs shrink-0">
                  {watchedItems.length} items selected
                </Badge>
              </div>

              {/* Kafka Async Notice Banner */}
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Saved as <strong>PENDING</strong> &amp; written to Transactional Outbox. Kafka consumers process inventory reservation (<code className="font-mono">order.inventory</code>) and payment (<code className="font-mono">order.payment</code>) asynchronously.
                </p>
              </div>

              {/* Selected Line Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {watchedItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground border rounded-lg border-dashed">
                    No items selected yet. Choose products from the catalog.
                  </div>
                ) : (
                  watchedItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between text-xs py-2 border-b border-border/40 last:border-0"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-medium text-foreground block truncate">
                          {item.productName}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {item.quantity} × {formatINR(Number(item.unitPrice))}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatINR(Number(item.lineTotal))}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(item.productId, -item.quantity)
                          }
                          className="text-muted-foreground hover:text-destructive p-1 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="pt-3 border-t border-border space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {formatINR(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Estimated GST (Included)</span>
                  <span className="tabular-nums">Standard B2B Pricing</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Shipping &amp; Logistics</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    FREE (Priority Dispatch)
                  </span>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    Grand Total
                  </span>
                  <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                    {formatINR(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Method & Failure Simulation Selector */}
              <div className="pt-3 border-t border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Payment Gateway Mode
                  </span>
                  <Badge
                    variant={
                      watchedPaymentMethod === "MOCK_FAIL"
                        ? "cancelled"
                        : "confirmed"
                    }
                    className="text-[10px] px-1.5 py-0 font-mono"
                  >
                    {watchedPaymentMethod === "MOCK_FAIL"
                      ? "SIMULATE DECLINE"
                      : "WILL SUCCEED"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(
                    [
                      {
                        id: "UPI",
                        label: "UPI Instant",
                        sub: "Payment Succeeds",
                      },
                      {
                        id: "CREDIT_CARD",
                        label: "Corporate Card",
                        sub: "Payment Succeeds",
                      },
                      {
                        id: "NET_BANKING",
                        label: "Net Banking",
                        sub: "Payment Succeeds",
                      },
                      {
                        id: "MOCK_FAIL",
                        label: "Simulate Decline",
                        sub: "Fails & Restores Stock",
                      },
                    ] as const
                  ).map((pm) => {
                    const isSelected = watchedPaymentMethod === pm.id;
                    const isFail = pm.id === "MOCK_FAIL";
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() =>
                          setValue("paymentMethod", pm.id, {
                            shouldValidate: true,
                          })
                        }
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? isFail
                              ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-500/40 text-rose-900 dark:text-rose-200"
                              : "border-primary bg-primary-subtle ring-1 ring-primary/40 text-foreground"
                            : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <span className="font-semibold block text-[11px]">
                          {pm.label}
                        </span>
                        <span className="text-[10px] opacity-80 block mt-0.5">
                          {pm.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kafka Payload Preview Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayload(!showPayload)}
                  className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground py-1 font-mono"
                >
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    POST /api/orders Payload Preview
                  </span>
                  {showPayload ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>

                {showPayload && (
                  <pre className="mt-2 p-2.5 rounded-lg bg-muted text-[11px] font-mono overflow-x-auto no-scrollbar text-muted-foreground border border-border">
                    {JSON.stringify(
                      {
                        customerId: isAdmin ? watchedCustomerId : user?.id,
                        paymentMethod: watchedPaymentMethod,
                        items: watchedItems.map((i) => ({
                          productId: i.productId,
                          quantity: i.quantity,
                        })),
                      },
                      null,
                      2
                    )}
                  </pre>
                )}
              </div>

              {/* Form Validation Indicator */}
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">
                  {isAdmin
                    ? `Admin selected: ${selectedCustomer?.name || "Customer"}`
                    : `Ordering for self: ${user?.name || "Current User"}`}{" "}
                  • {watchedItems.length} items in cart
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || watchedItems.length === 0}
                  className="w-full h-11 text-sm font-bold bg-primary hover:bg-primary-hover text-white shadow-none"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publishing to Kafka...
                    </span>
                  ) : (
                    "Place Order →"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    reset({
                      customerId: isAdmin ? watchedCustomerId : user?.id || "",
                      customerName: selectedCustomer?.name || "",
                      customerEmail: selectedCustomer?.email || "",
                      paymentMethod: "UPI",
                      deliveryNotes: "Priority Delivery via Kafka Event Pipeline",
                      items: [],
                    })
                  }
                  className="w-full h-8 text-xs font-medium gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear Cart Items
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground text-center">
                Outbox publisher relays to Kafka within 500ms. Redirects to Live Status on dispatch.
              </p>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
