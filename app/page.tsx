"use client";

import React from "react";
import Link from "next/link";
import { Plus, ArrowRight, RefreshCw, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { KpiCard } from "@/components/order/kpi-card";
import { StatusDonutChart } from "@/components/order/status-donut-chart";
import { KafkaStreamCard } from "@/components/order/kafka-stream-card";
import { OrdersDataTable } from "@/components/order/orders-data-table";
import { SystemHealthBanner } from "@/components/order/system-health-banner";
import { useGetOrdersQuery, useGetProductsQuery } from "@/store/api/order-api";
import { useAppSelector } from "@/store";

export default function DashboardPage() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);
  const isInventoryManager = user?.role === "INVENTORY_MANAGER";

  const {
    data: orders = [],
    refetch,
    isFetching,
  } = useGetOrdersQuery(undefined, {
    skip: !isAuthenticated || isInventoryManager,
    pollingInterval: 3000,
  });

  const { data: products = [], refetch: refetchProducts } = useGetProductsQuery(
    undefined,
    {
      skip: !isAuthenticated,
      pollingInterval: 5000,
    }
  );

  // Compute live KPI values strictly from real backend orders
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const confirmedCount = orders.filter((o) => o.status === "CONFIRMED").length;
  const cancelledCount = orders.filter((o) => o.status === "CANCELLED").length;
  const successRate =
    totalCount > 0 ? ((confirmedCount / totalCount) * 100).toFixed(1) : "100.0";

  const totalUnitsInStock = products.reduce(
    (sum, p) => sum + (p.stockQuantity || 0),
    0
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Top Section - PageHeader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            {user?.role === "ADMIN"
              ? "Admin Console: Real-time overview of all customer orders, inventory stock, and Kafka topics."
              : isInventoryManager
              ? `Inventory Console: Manage PostgreSQL product catalog (${products.length} products, ${totalUnitsInStock} total units) and monitor order.inventory events.`
              : `Customer Portal: Live tracking of orders placed by ${user?.name || "your account"}.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!isInventoryManager) refetch();
              refetchProducts();
            }}
            disabled={isFetching}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {isInventoryManager ? (
            <Button
              asChild
              variant="default"
              size="default"
              className="h-9 px-4 gap-2 text-xs font-semibold shadow-none bg-primary hover:bg-primary-hover text-white"
            >
              <Link href="/inventory">
                <Boxes className="h-4 w-4" />
                Manage Inventory
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="default"
              size="default"
              className="h-9 px-4 gap-2 text-xs font-semibold shadow-none bg-primary hover:bg-primary-hover text-white"
            >
              <Link href="/orders/new">
                <Plus className="h-4 w-4" />
                Place Order
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Section 1 - KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Total Orders"
          value={totalCount.toLocaleString()}
          subtext={
            user?.role === "ADMIN" ? "All customers in DB" : "Tracked orders"
          }
          badge="Live PostgreSQL"
          badgeVariant="neutral"
        />

        <KpiCard
          label="Pending (In Kafka)"
          value={pendingCount.toString()}
          subtext="Awaiting consumers"
          badge="In-flight"
          badgeVariant="warning"
          pulsingDot={pendingCount > 0}
          colorClass="text-amber-600 dark:text-amber-400"
        />

        <KpiCard
          label="Confirmed Orders"
          value={confirmedCount.toLocaleString()}
          subtext="Inventory & payment settled"
          badge={`${successRate}% confirmed`}
          badgeVariant="success"
          colorClass="text-emerald-600 dark:text-emerald-400"
        />

        <KpiCard
          label="Cancelled / Failed"
          value={cancelledCount.toString()}
          subtext="Stockout or payment failed"
          badge="Compensated"
          badgeVariant="danger"
          colorClass="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* Section 2 - Analytics & Queue Health (Two Columns: 7 cols & 5 cols grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <StatusDonutChart orders={orders} />
        </div>
        <div className="lg:col-span-5">
          <KafkaStreamCard maxEvents={5} />
        </div>
      </div>

      {/* Section 3 - Recent Orders Table */}
      {!isInventoryManager && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription className="mt-1">
                Latest 5 orders from backend database across all asynchronous lifecycle states
              </CardDescription>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-primary hover:bg-primary-subtle"
            >
              <Link href="/orders" className="flex items-center gap-1">
                View all orders <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <OrdersDataTable
              orders={orders.slice(0, 5)}
              pageSize={5}
              showPagination={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Section 4 - Quick System Health Banner */}
      <SystemHealthBanner />
    </div>
  );
}
