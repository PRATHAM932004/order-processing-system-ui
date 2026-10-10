"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Download,
  RefreshCw,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomSelect } from "@/components/ui/custom-select";
import { OrdersDataTable } from "@/components/order/orders-data-table";
import { useGetOrdersQuery } from "@/store/api/order-api";
import { useAppSelector } from "@/store";
import { toast } from "sonner";

const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "all", label: "All Time" },
];

export default function OrdersPage() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);
  const {
    data: allOrders = [],
    refetch,
    isFetching,
  } = useGetOrdersQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 5000,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<string>("30d");

  const pendingCount = allOrders.filter((o) => o.status === "PENDING").length;
  const confirmedCount = allOrders.filter((o) => o.status === "CONFIRMED").length;
  const cancelledCount = allOrders.filter((o) => o.status === "CANCELLED").length;

  const now = Date.now();
  const rangeMs =
    dateRange === "today"
      ? 24 * 60 * 60 * 1000
      : dateRange === "7d"
      ? 7 * 24 * 60 * 60 * 1000
      : dateRange === "30d"
      ? 30 * 24 * 60 * 60 * 1000
      : null;

  // Filter orders
  const filteredOrders = allOrders.filter((order) => {
    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;

    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      order.id.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerEmail.toLowerCase().includes(query);

    const ts = new Date(order.createdAt).getTime();
    const matchesDate =
      !rangeMs || Number.isNaN(ts) || now - ts <= rangeMs;

    return matchesStatus && matchesSearch && matchesDate;
  });

  const handleExport = (format: "json" | "csv") => {
    if (format === "json") {
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(filteredOrders, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `orders_export_${Date.now()}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Exported orders as JSON payload");
    } else {
      const headers = "ID,Customer,Email,Status,Amount,CreatedAt\n";
      const rows = filteredOrders
        .map(
          (o) =>
            `"${o.id}","${o.customerName}","${o.customerEmail}","${o.status}",${o.totalAmount},"${o.createdAt}"`
        )
        .join("\n");
      const dataStr =
        "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `orders_export_${Date.now()}.csv`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Exported orders as CSV");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setDateRange("30d");
  };

  const isFiltered = search !== "" || statusFilter !== "ALL";

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
              {user?.role === "ADMIN" ? "All Orders (Admin View)" : "My Orders"}
            </h1>
            <Badge variant="subtle" className="text-xs font-mono shrink-0">
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            {user?.role === "ADMIN"
              ? "Audit, search, and track all customer order lifecycles across the distributed Kafka pipeline."
              : `Viewing orders placed by ${user?.name || "your account"} (${user?.email || ""}).`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Auto-refresh: 5s
          </Button>

          <Button
            asChild
            variant="default"
            size="default"
            className="h-9 px-4 gap-2 text-xs font-semibold shadow-none bg-primary hover:bg-primary-hover text-white"
          >
            <Link href="/orders/new">
              <Plus className="h-4 w-4" />
              New Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip (Filterable metric chips) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === "ALL"
              ? "border-primary bg-primary-subtle/50 ring-1 ring-primary/40"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">
            All Orders
          </span>
          <span className="text-xl font-bold tracking-tight font-sans tabular-nums text-foreground mt-1 block">
            {allOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === "PENDING"
              ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-400"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">
              Pending (In Kafka)
            </span>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tight font-sans tabular-nums text-amber-600 dark:text-amber-400 mt-1 block">
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("CONFIRMED")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === "CONFIRMED"
              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-400"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">
              Confirmed
            </span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <span className="text-xl font-bold tracking-tight font-sans tabular-nums text-emerald-600 dark:text-emerald-400 mt-1 block">
            {confirmedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("CANCELLED")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === "CANCELLED"
              ? "border-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-400"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">
              Cancelled / Failed
            </span>
            <XCircle className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <span className="text-xl font-bold tracking-tight font-sans tabular-nums text-rose-600 dark:text-rose-400 mt-1 block">
            {cancelledCount}
          </span>
        </button>
      </div>

      {/* Filter & Search Controls Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] sm:min-w-[240px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by Order ID, customer, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            {/* Date Range Dropdown */}
            <CustomSelect
              value={dateRange}
              onChange={(val) => setDateRange(val)}
              options={DATE_RANGE_OPTIONS}
              icon={<Calendar className="h-3.5 w-3.5" />}
              className="w-40"
              ariaLabel="Filter orders by date range"
            />
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Applied filters feedback */}
        <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Showing{" "}
            <strong className="text-foreground">{filteredOrders.length}</strong>{" "}
            of <strong>{allOrders.length}</strong> orders from backend
          </span>

          <span className="font-mono text-[11px]">
            Topics: order.created • order.inventory • order.payment
          </span>
        </div>
      </Card>

      {/* Orders DataTable */}
      <OrdersDataTable
        orders={filteredOrders}
        pageSize={10}
        showPagination={true}
      />
    </div>
  );
}
