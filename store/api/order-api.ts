import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import {
  Order,
  Customer,
  CreateUserPayload,
  UpdateUserRolePayload,
  Product,
  ProductPayload,
  UpdateStockPayload,
  InventoryReservation,
  KafkaEvent,
  CreateOrderPayload,
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  SystemStatus,
} from "@/lib/types";
import type { RootState } from "../index";
import { logout } from "../auth-slice";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const API_BASE_URL = rawApiUrl
  ? `${rawApiUrl.replace(/\/+$/, "").replace(/\/api$/, "")}/api`
  : "/backend-api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    headers.set("Content-Type", "application/json");
    let token = (getState() as RootState)?.auth?.token ?? null;
    if (!token && typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("orderflow_auth");
        if (raw) {
          const parsed = JSON.parse(raw);
          token = parsed?.token ?? null;
        }
      } catch {
        // ignore
      }
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWith401Logout: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const url = typeof args === "string" ? args : args.url;
    const isLoginEndpoint = url?.includes("/auth/login");

    // Remove all tokens, user details, and Redux credentials
    api.dispatch(logout());

    // Reset RTK Query cache
    api.dispatch({ type: "orderApi/resetApiState" });

    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("orderflow_auth");
        window.sessionStorage.clear();
      } catch {
        // ignore
      }

      // If not already on login page, proceed to logout and redirect to login again
      if (!isLoginEndpoint && !window.location.pathname.startsWith("/auth/login")) {
        window.location.href = "/auth/login";
      }
    }
  }

  return result;
};

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: baseQueryWith401Logout,
  tagTypes: [
    "Orders",
    "Order",
    "Products",
    "Reservations",
    "Customers",
    "KafkaEvents",
    "Auth",
  ],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginPayload>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "Orders",
        "Customers",
        "Products",
        "Reservations",
        "KafkaEvents",
        "Auth",
      ],
    }),

    register: builder.mutation<AuthResponse, RegisterPayload>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders", "Customers", "KafkaEvents", "Auth"],
    }),

    getMe: builder.query<AuthUser, void>({
      query: () => "/auth/me",
      providesTags: ["Auth"],
    }),

    getOrders: builder.query<Order[], { search?: string; status?: string } | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args && "status" in args && args.status && args.status !== "ALL") {
          params.set("status", args.status);
        }
        if (args && "search" in args && args.search) {
          params.set("search", args.search);
        }
        const qs = params.toString();
        return `/orders${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Orders"],
    }),

    getOrderById: builder.query<Order, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),

    createOrder: builder.mutation<Order, CreateOrderPayload>({
      query: (payload) => ({
        url: "/orders",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Orders", "Products", "Reservations", "KafkaEvents"],
    }),

    getProducts: builder.query<Product[], void>({
      query: () => "/products",
      providesTags: ["Products"],
    }),

    createProduct: builder.mutation<Product, ProductPayload>({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Products"],
    }),

    updateProduct: builder.mutation<Product, { id: string; body: ProductPayload }>({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Products", "Reservations"],
    }),

    updateProductStock: builder.mutation<Product, UpdateStockPayload>({
      query: ({ id, stockQuantity }) => ({
        url: `/products/${id}/stock`,
        method: "PATCH",
        body: { stockQuantity },
      }),
      invalidatesTags: ["Products"],
    }),

    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products"],
    }),

    getInventoryReservations: builder.query<InventoryReservation[], void>({
      query: () => "/products/reservations",
      providesTags: ["Reservations"],
    }),

    getCustomers: builder.query<Customer[], void>({
      query: () => "/customers",
      providesTags: ["Customers"],
    }),

    createUser: builder.mutation<Customer, CreateUserPayload>({
      query: (body) => ({
        url: "/customers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customers"],
    }),

    updateUserRole: builder.mutation<Customer, UpdateUserRolePayload>({
      query: ({ id, role }) => ({
        url: `/customers/${id}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["Customers"],
    }),

    getKafkaEvents: builder.query<KafkaEvent[], { orderId?: string } | void>({
      query: (args) => {
        if (args && "orderId" in args && args.orderId) {
          return `/events?orderId=${encodeURIComponent(args.orderId)}`;
        }
        return "/events";
      },
      providesTags: ["KafkaEvents"],
    }),

    getSystemStatus: builder.query<SystemStatus, void>({
      query: () => "/system/status",
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductStockMutation,
  useDeleteProductMutation,
  useGetInventoryReservationsQuery,
  useGetCustomersQuery,
  useCreateUserMutation,
  useUpdateUserRoleMutation,
  useGetKafkaEventsQuery,
  useGetSystemStatusQuery,
} = orderApi;

