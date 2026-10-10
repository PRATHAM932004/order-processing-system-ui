import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Customer, OrderItem } from "@/lib/types";
import { MOCK_CUSTOMERS } from "@/lib/mock-data";

interface OrderUiState {
  selectedCustomer: Customer;
  cartItems: OrderItem[];
  simulationSpeed: "1x" | "2x" | "pause";
  isLivePolling: boolean;
  activeFilterStatus: string;
  searchQuery: string;
}

const initialState: OrderUiState = {
  selectedCustomer: MOCK_CUSTOMERS[2], // Default: Asha Mehta as in Stitch prompt
  cartItems: [],
  simulationSpeed: "1x",
  isLivePolling: true,
  activeFilterStatus: "ALL",
  searchQuery: "",
};

export const orderSlice = createSlice({
  name: "orderUi",
  initialState,
  reducers: {
    setSelectedCustomer: (state, action: PayloadAction<Customer>) => {
      state.selectedCustomer = action.payload;
    },
    setCartItems: (state, action: PayloadAction<OrderItem[]>) => {
      state.cartItems = action.payload;
    },
    updateCartItemQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        state.cartItems = state.cartItems.filter((i) => i.productId !== productId);
      } else {
        const item = state.cartItems.find((i) => i.productId !== productId);
        if (item) {
          item.quantity = quantity;
          item.lineTotal = item.unitPrice * quantity;
        }
      }
    },
    clearCart: (state) => {
      state.cartItems = [];
    },
    toggleLivePolling: (state) => {
      state.isLivePolling = !state.isLivePolling;
    },
    setFilterStatus: (state, action: PayloadAction<string>) => {
      state.activeFilterStatus = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSimulationSpeed: (state, action: PayloadAction<"1x" | "2x" | "pause">) => {
      state.simulationSpeed = action.payload;
    },
  },
});

export const {
  setSelectedCustomer,
  setCartItems,
  updateCartItemQuantity,
  clearCart,
  toggleLivePolling,
  setFilterStatus,
  setSearchQuery,
  setSimulationSpeed,
} = orderSlice.actions;

export default orderSlice.reducer;
