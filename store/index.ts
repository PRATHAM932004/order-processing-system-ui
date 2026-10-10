import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { orderApi } from "./api/order-api";
import orderUiReducer from "./order-slice";
import kafkaReducer from "./kafka-slice";
import authReducer from "./auth-slice";

export const store = configureStore({
  reducer: {
    [orderApi.reducerPath]: orderApi.reducer,
    orderUi: orderUiReducer,
    kafka: kafkaReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(orderApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
