export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type EventPhase =
  | "ORDER_PLACED"
  | "INVENTORY_RESERVED"
  | "PAYMENT_PROCESSED"
  | "ORDER_CONFIRMED"
  | "FAILED";

export type UserRole = "CUSTOMER" | "ADMIN" | "INVENTORY_MANAGER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  createdAt?: string;
  address?: string;
  creditLimit?: string;
  isVerified?: boolean;
  avatarUrl?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRolePayload {
  id: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  sku?: string;
  description?: string;
}

export interface ProductPayload {
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
}

export interface UpdateStockPayload {
  id: string;
  stockQuantity: number;
}

export type ReservationStatus = "RESERVED" | "FAILED" | "COMPENSATED";

export interface InventoryReservation {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  status: ReservationStatus;
  createdAt: string;
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  category?: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  kafkaPartition?: number;
  kafkaOffset?: number;
  currentPhase?: EventPhase | string;
  failureReason?: string;
  slaTarget?: string;
  broker?: string;
  consumerGroupId?: string;
}

export interface KafkaEvent {
  id: string;
  orderId: string;
  eventType: string;
  topic: string;
  partition: number;
  offset: number;
  timestamp: string;
  consumerGroup?: string;
  payloadSummary?: string;
  latencyMs?: number;
  status: "SUCCESS" | "IN_PROGRESS" | "FAILED" | string;
}

export interface CreateOrderPayload {
  customerId?: string;
  paymentMethod?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface OrderFilterParams {
  search?: string;
  status?: OrderStatus | "ALL";
  dateRange?: "today" | "7d" | "30d" | "all";
  customerId?: string;
  partition?: number | "all";
  page: number;
  pageSize: number;
}

export interface SystemStatus {
  backendStatus: "CONNECTED" | "DISCONNECTED" | string;
  backendPort: number;
  dbStatus: "HEALTHY" | "DOWN" | string;
  dbEndpoint: string;
  dbPingMs: number;
  kafkaStatus: "OPERATIONAL" | "DEGRADED" | "DOWN" | string;
  kafkaBootstrapServers: string;
  activeBrokers: number;
  activeConsumerGroups: number;
  totalConsumerGroups: number;
  outboxPollIntervalMs: number;
  outboxBatchSize: number;
  unpublishedOutboxCount: number;
  lastOutboxRelayMs: number | null;
  endToEndLatencyMs: number;
  timestamp: string;
}
