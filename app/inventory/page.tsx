"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productFormSchema,
  ProductFormValues,
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
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductStockMutation,
  useDeleteProductMutation,
  useGetInventoryReservationsQuery,
} from "@/store/api/order-api";
import { useAppSelector } from "@/store";
import { Product, ReservationStatus } from "@/lib/types";
import { formatINR, formatRelativeTime } from "@/lib/utils";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  GitBranch,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORY_PRESETS = ["Electronics", "Furniture", "Stationery", "Accessories"];

export default function InventoryPage() {
  const user = useAppSelector((state) => state.auth.user);
  const canManage =
    user?.role === "ADMIN" || user?.role === "INVENTORY_MANAGER";

  const {
    data: products = [],
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
    refetch: refetchProducts,
  } = useGetProductsQuery(undefined, {
    pollingInterval: 5000,
  });

  const {
    data: reservations = [],
    isFetching: isFetchingReservations,
    refetch: refetchReservations,
  } = useGetInventoryReservationsQuery(undefined, {
    skip: !canManage,
    pollingInterval: 5000,
  });

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [updateStock] = useUpdateProductStockMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [reservationFilter, setReservationFilter] = useState<
    "ALL" | ReservationStatus
  >("ALL");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      category: "Electronics",
      price: 999,
      stockQuantity: 50,
    },
  });

  const { handleSubmit, reset, setValue, watch } = form;
  const selectedCategory = watch("category");

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      category: product.category,
      price: Number(product.price),
      stockQuantity: product.stockQuantity,
    });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    reset({
      name: "",
      category: "Electronics",
      price: 999,
      stockQuantity: 50,
    });
  };

  const onSubmit = async (values: ProductFormValues) => {
    try {
      if (editingProduct) {
        await updateProduct({
          id: editingProduct.id,
          body: values,
        }).unwrap();
        toast.success(`Updated product "${values.name}"`);
        cancelEdit();
      } else {
        await createProduct(values).unwrap();
        toast.success(`Created product "${values.name}" in catalog`);
        reset({
          name: "",
          category: values.category,
          price: 999,
          stockQuantity: 50,
        });
      }
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string; message?: string } })?.data?.error ||
        (err as { data?: { error?: string; message?: string } })?.data?.message ||
        "Failed to save product";
      toast.error(msg);
    }
  };

  const handleAdjustStock = async (product: Product, delta: number) => {
    const nextStock = Math.max(0, product.stockQuantity + delta);
    try {
      await updateStock({
        id: product.id,
        stockQuantity: nextStock,
      }).unwrap();
      toast.success(
        `Updated stock for ${product.name}: ${product.stockQuantity} → ${nextStock}`
      );
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ||
        "Failed to update stock";
      toast.error(msg);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteProduct(product.id).unwrap();
      toast.success(`Removed "${product.name}" from catalog`);
      if (editingProduct?.id === product.id) {
        cancelEdit();
      }
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ||
        "Cannot delete product (may be referenced by existing orders)";
      toast.error(msg);
    }
  };

  // KPI metrics
  const totalProducts = products.length;
  const totalUnitsInStock = products.reduce(
    (sum, p) => sum + (p.stockQuantity || 0),
    0
  );
  const lowStockCount = products.filter((p) => p.stockQuantity <= 5).length;
  const reservedCount = reservations.filter(
    (r) => r.status === "RESERVED"
  ).length;

  const categories = [
    "ALL",
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      categoryFilter === "ALL" || p.category === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredReservations = reservations.filter((r) =>
    reservationFilter === "ALL" ? true : r.status === reservationFilter
  );

  if (!canManage) {
    return (
      <Card className="p-8 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
        <h2 className="text-lg font-semibold text-foreground">
          Inventory Manager or Admin Access Required
        </h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Only users with the <code className="font-mono">INVENTORY_MANAGER</code> or{" "}
          <code className="font-mono">ADMIN</code> role can manage product stock and inspect inventory reservations.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/50">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
              Inventory &amp; Catalog Management
            </h1>
            <Badge variant="subtle" className="text-xs font-mono shrink-0">
              Role: {user?.role}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Create products, restock warehouse inventory in PostgreSQL, and audit asynchronous{" "}
            <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">
              order.inventory
            </code>{" "}
            reservations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchProducts();
              refetchReservations();
              toast.success("Refreshed catalog and reservation ledger");
            }}
            disabled={isFetchingProducts || isFetchingReservations}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isFetchingProducts || isFetchingReservations
                  ? "animate-spin"
                  : ""
              }`}
            />
            Sync Stock
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <Link href="/kafka-stream">
              <GitBranch className="h-3.5 w-3.5 text-primary" />
              order.inventory Stream
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Catalog Products"
          value={totalProducts.toString()}
          subtext="Active SKUs in PostgreSQL"
          badge="products table"
          badgeVariant="neutral"
        />

        <KpiCard
          label="Total Units in Stock"
          value={totalUnitsInStock.toLocaleString()}
          subtext="Available for reservation"
          badge="Live Stock"
          badgeVariant="success"
          colorClass="text-emerald-600 dark:text-emerald-400"
        />

        <KpiCard
          label="Low / Out of Stock"
          value={lowStockCount.toString()}
          subtext="Products with ≤ 5 units"
          badge={lowStockCount > 0 ? "Needs Restock" : "Healthy"}
          badgeVariant={lowStockCount > 0 ? "warning" : "success"}
          pulsingDot={lowStockCount > 0}
          colorClass={
            lowStockCount > 0
              ? "text-amber-600 dark:text-amber-400"
              : "text-foreground"
          }
        />

        <KpiCard
          label="Active Reservations"
          value={reservedCount.toString()}
          subtext={`${reservations.length} total reservation events`}
          badge="order.inventory"
          badgeVariant="default"
        />
      </div>

      {/* Main Grid: Left (Create/Edit Product Form) + Right (Product Catalog Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Product Create / Edit Card */}
        <Card className="lg:col-span-4 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
            </div>
            {editingProduct && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                className="h-7 px-2 text-xs text-muted-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Product Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Wireless Mechanical Keyboard"
                        className="h-9 text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Category</FormLabel>
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {CATEGORY_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setValue("category", preset, {
                              shouldValidate: true,
                            })
                          }
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                            selectedCategory === preset
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <FormControl>
                      <Input
                        placeholder="e.g. Electronics"
                        className="h-9 text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Unit Price (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="h-9 text-xs font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Initial Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className="h-9 text-xs font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={isCreating || isUpdating}
                className="w-full h-9 text-xs font-semibold bg-primary hover:bg-primary-hover text-white gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {editingProduct
                  ? isUpdating
                    ? "Saving Changes..."
                    : "Update Product"
                  : isCreating
                  ? "Creating Product..."
                  : "Add Product to Catalog"}
              </Button>
            </form>
          </Form>
        </Card>

        {/* Product Catalog & Quick Stock Manager */}
        <Card className="lg:col-span-8 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Boxes className="h-4 w-4 text-primary" />
                <span>PostgreSQL Product Catalog ({filteredProducts.length})</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adjust stock quantities directly or edit product details
              </p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter by product or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === "ALL" ? "All Categories" : cat}
              </button>
            ))}
          </div>

          {isLoadingProducts ? (
            <div className="py-12 text-center text-xs text-muted-foreground font-mono">
              Loading products from PostgreSQL...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center space-y-2 border rounded-xl border-dashed">
              <p className="text-xs font-medium text-foreground">
                No products in catalog yet
              </p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Use the &ldquo;Add New Product&rdquo; form on the left to seed your first product into PostgreSQL.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3">Stock Level</th>
                    <th className="py-2.5 px-3">Quick Restock</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredProducts.map((prod) => {
                    const isLow = prod.stockQuantity <= 5;
                    return (
                      <tr
                        key={prod.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="font-semibold text-foreground">
                            {prod.name}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {prod.id.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[11px]">
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold tabular-nums text-foreground">
                          {formatINR(Number(prod.price))}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
                              prod.stockQuantity === 0
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                : isLow
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {prod.stockQuantity} units
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={prod.stockQuantity === 0}
                              onClick={() => handleAdjustStock(prod, -1)}
                              className="h-7 px-2 text-[11px] font-mono"
                            >
                              -1
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdjustStock(prod, 10)}
                              className="h-7 px-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400"
                            >
                              +10
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdjustStock(prod, 50)}
                              className="h-7 px-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400"
                            >
                              +50
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => startEdit(prod)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Edit product"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProduct(prod)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              title="Delete product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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

      {/* Inventory Reservations Ledger */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>
                Inventory Reservations Ledger ({filteredReservations.length})
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time records from <code className="font-mono">inventory_reservations</code> created by <code className="font-mono">InventoryConsumer</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(["ALL", "RESERVED", "FAILED", "COMPENSATED"] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setReservationFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                    reservationFilter === st
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground border rounded-xl border-dashed">
            No inventory reservations recorded for status {reservationFilter} yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 px-3">Reservation ID</th>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Qty Reserved</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {filteredReservations.map((res) => (
                  <tr
                    key={res.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-muted-foreground">
                      #{res.id.substring(0, 8)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-primary font-semibold">
                        #{res.orderId.substring(0, 8)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-medium text-foreground">
                        {res.productName}
                      </span>{" "}
                      <span className="text-[10px] text-muted-foreground">
                        ({res.category})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {res.quantity}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          res.status === "RESERVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : res.status === "COMPENSATED"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground font-sans">
                      {formatRelativeTime(res.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
