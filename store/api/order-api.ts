import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  Order,
  Customer,
  Product,
  KafkaEvent,
  CreateOrderPayload,
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "@/lib/types";
import type { RootState } from "../index";

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/backend-api",
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
  }),
  tagTypes: ["Orders", "Order", "Products", "Customers", "KafkaEvents", "Auth"],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginPayload>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders", "Customers", "KafkaEvents", "Auth"],
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
      invalidatesTags: ["Orders", "Products", "KafkaEvents"],
    }),

    getProducts: builder.query<Product[], void>({
      query: () => "/products",
      providesTags: ["Products"],
    }),

    getCustomers: builder.query<Customer[], void>({
      query: () => "/customers",
      providesTags: ["Customers"],
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
  useGetCustomersQuery,
  useGetKafkaEventsQuery,
} = orderApi;
