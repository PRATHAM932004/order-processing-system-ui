"use client";

import React, { useState } from "react";
import { Order } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { formatINR, formatShortId, formatRelativeTime } from "@/lib/utils";
import {
  Copy,
  Check,
  ArrowRight,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { toast } from "sonner";
import Link from "next/link";

const PAGE_SIZE_OPTIONS = [
  { value: 10, label: "10 / page" },
  { value: 25, label: "25 / page" },
  { value: 50, label: "50 / page" },
  { value: 100, label: "100 / page" },
];

interface OrdersDataTableProps {
  orders: Order[];
  pageSize?: number;
  showPagination?: boolean;
}

export function OrdersDataTable({
  orders,
  pageSize = 10,
  showPagination = true,
}: OrdersDataTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const handleCopyUuid = (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(uuid);
    setCopiedId(uuid);
    toast.success(`Copied full UUID to clipboard: ${uuid}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Pagination calculation
  const totalPages = Math.ceil(orders.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentOrders = showPagination
    ? orders.slice(startIndex, startIndex + rowsPerPage)
    : orders;

  if (orders.length === 0) {
    return (
      <div className="py-12 sm:py-16 px-4 text-center border rounded-xl border-dashed border-border bg-card/40">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-subtle text-primary mb-3">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <h4 className="text-base font-semibold text-foreground">
          No orders found
        </h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          No orders match the current filter criteria or your account yet.
        </p>
        <div className="mt-4">
          <Button asChild variant="default" size="sm">
            <Link href="/orders/new">+ Place your first order</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Stacked Card Layout (< md) */}
      <div className="md:hidden space-y-3">
        {currentOrders.map((order) => {
          const shortId = formatShortId(order.id);
          const itemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
          const firstItemName = order.items[0]?.productName || "Product";
          const itemsSummary =
            order.items.length === 1
              ? `${order.items[0].quantity}x ${firstItemName}`
              : `${itemsCount} items (${firstItemName} +${
                  order.items.length - 1
                } more)`;

          return (
            <div
              key={order.id}
              className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-2xs"
            >
              {/* Top Row: Order ID + Status Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded border border-border/60">
                    #{shortId}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyUuid(order.id, e)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                    title="Copy full UUID"
                  >
                    {copiedId === order.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* Customer & Items Info */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                    {getInitials(order.customerName)}
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium text-foreground text-xs block truncate">
                      {order.customerName}
                    </span>
                    <span className="text-[11px] text-muted-foreground block truncate">
                      {itemsSummary}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold text-sm tabular-nums text-foreground block">
                    {formatINR(order.totalAmount)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {formatRelativeTime(order.createdAt)}
                  </span>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-2.5 border-t border-border/50 flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">
                  Phase: {order.currentPhase || order.status}
                </span>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs font-semibold text-primary hover:bg-primary-subtle"
                >
                  <Link href={`/orders/${order.id}`} className="gap-1">
                    <span>View Details</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tablet & Desktop Scrollable Table Layout (md+) */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[115px]">Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden lg:table-cell">Items &amp; SKUs</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden xl:table-cell">Phase</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right w-[90px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentOrders.map((order) => {
              const shortId = formatShortId(order.id);
              const itemsCount = order.items.reduce(
                (acc, i) => acc + i.quantity,
                0
              );
              const firstItemName = order.items[0]?.productName || "Product";
              const itemsSummary =
                order.items.length === 1
                  ? `${order.items[0].quantity}x ${firstItemName}`
                  : `${itemsCount} items (${firstItemName} +${
                      order.items.length - 1
                    } more)`;

              return (
                <TableRow key={order.id} className="group">
                  {/* Order ID */}
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
                        {shortId}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyUuid(order.id, e)}
                        className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded hover:bg-muted"
                        title="Copy full UUID"
                      >
                        {copiedId === order.id ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-[11px]">
                        {getInitials(order.customerName)}
                      </div>
                      <div className="flex flex-col min-w-0 max-w-[180px] xl:max-w-[240px]">
                        <span className="font-medium text-foreground text-xs leading-none truncate">
                          {order.customerName}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {order.customerEmail}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Items */}
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[200px]">
                    <span className="line-clamp-1">{itemsSummary}</span>
                  </TableCell>

                  {/* Total Amount */}
                  <TableCell className="text-right font-medium text-xs tabular-nums text-foreground whitespace-nowrap">
                    {formatINR(order.totalAmount)}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge status={order.status} />
                  </TableCell>

                  {/* Saga Phase */}
                  <TableCell className="hidden xl:table-cell font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded bg-muted/80 border border-border/50">
                      {order.currentPhase || order.status}
                    </span>
                  </TableCell>

                  {/* Created Relative Time */}
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    <span title={new Date(order.createdAt).toLocaleString()}>
                      {formatRelativeTime(order.createdAt)}
                    </span>
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary-subtle"
                    >
                      <Link href={`/orders/${order.id}`} className="gap-1">
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {showPagination && orders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
          <div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(startIndex + rowsPerPage, orders.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {orders.length}
            </span>{" "}
            orders • {totalPages} pages
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <span>Show:</span>
              <CustomSelect
                value={rowsPerPage}
                onChange={(val) => {
                  setRowsPerPage(Number(val));
                  setCurrentPage(1);
                }}
                options={PAGE_SIZE_OPTIONS}
                className="w-28"
                menuAlign="right"
                ariaLabel="Rows per page"
              />
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
