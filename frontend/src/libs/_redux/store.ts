import { configureAppStore } from "./configureStore";

export const store = configureAppStore();

// Export the types
export type { RootState, AppDispatch } from "./configureStore";
