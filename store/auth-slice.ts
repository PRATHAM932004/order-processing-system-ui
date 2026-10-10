import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthUser } from "@/lib/types";

const AUTH_STORAGE_KEY = "orderflow_auth";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth: (state) => {
      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { token: string; user: AuthUser };
            if (parsed?.token && parsed?.user) {
              state.token = parsed.token;
              state.user = parsed.user;
              state.isAuthenticated = true;
            }
          }
        } catch {
          // Ignore malformed storage
        }
      }
      state.isHydrated = true;
    },
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: AuthUser }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isHydrated = true;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify(action.payload)
        );
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isHydrated = true;
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    },
  },
});

export const { hydrateAuth, setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
