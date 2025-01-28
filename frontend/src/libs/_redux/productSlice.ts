import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ProductFilters, ProductState } from "@/src/types";
import { RootState } from "./reduxTypes";


// Initial filters state
const initialFilters: ProductFilters = {
    search: "",
    category: undefined,
    stock_status: undefined,
    min_price: undefined,
    max_price: undefined,
    is_featured: undefined,
    ordering: undefined,
    page: 1,
    page_size: 10,
};

// Initial state
const initialState: ProductState = {
    filters: initialFilters,
    currentPage: 1,
    searchQuery: "",
};

// Create the slice
const productSlice = createSlice({
    name: "products",
    initialState,
    reducers: {
        // Reset filters to initial state
        resetFilters: (state) => {
            state.filters = initialFilters;
            state.currentPage = 1;
        },

        // Update filters
        setFilters: (state, action: PayloadAction<Partial<ProductFilters>>) => {
            state.filters = {
                ...state.filters,
                ...action.payload
            };
            // Reset page when filters change
            if (!action.payload.page) {
                state.filters.page = 1;
                state.currentPage = 1;
            }
        },

        // Set search query
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
            state.currentPage = 1;
        },

        // Set current page
        setCurrentPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
            state.filters.page = action.payload;
        }
    }
});

// Export actions
export const {
    resetFilters,
    setFilters,
    setSearchQuery,
    setCurrentPage,
} = productSlice.actions;

// Selectors
export const selectFilters = (state: RootState) => state.products.filters;
export const selectCurrentPage = (state: RootState) => state.products.currentPage;
export const selectSearchQuery = (state: RootState) => state.products.searchQuery;

export default productSlice.reducer;