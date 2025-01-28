import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import { AdminProduct, Category, ProductFilters, ProductResponse, ApiError } from "@/src/types";


class ProductService {
    private readonly baseUrl = '/api/v1/products/';
    private readonly categoryUrl = '/api/v1/categories/';

    // Get all products with filters
    async getProducts(filters: Partial<ProductFilters>): Promise<ProductResponse> {
        try {
            // convert filters to query params
            const params = new URLSearchParams();

            if (filters.search) params.append('search', filters.search);
            if (filters.category) params.append('category', filters.category);
            if (filters.stock_status) params.append('stock_status', filters.stock_status);
            if (filters.min_price) params.append('min_price', filters.min_price.toString());
            if (filters.max_price) params.append('max_price', filters.max_price.toString());
            if (filters.is_featured) params.append('is_featured', filters.is_featured.toString());
            if (filters.ordering) params.append('ordering', filters.ordering);
            if (filters.page) params.append('page', filters.page.toString());
            if (filters.page_size) params.append('page_size', filters.page_size.toString());

            const response = await axiosInstance.get<ProductResponse>(
                `${this.baseUrl}?${params.toString()}`
            );

            return response.data;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            throw new Error(
                err.response?.data?.detail || err.response?.data?.message || 'Failed to fetch products'
            );
        }
    };


    // Get single product by slug
    async getProductBySlug(slug: string): Promise<AdminProduct> {
        try {
            const response = await axiosInstance.get<AdminProduct>(
                `${this.baseUrl}${slug}/`
            );

            return response.data;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            throw new Error(
                err.response?.data?.detail || err.response?.data?.message || 'Failed to fetch product'
            );
        }
    };


    // Get all categories
    async getCategories(): Promise<Category[]> { 
        try {
            const response = await axiosInstance.get<Category[]>(
                this.categoryUrl
            );

            return response.data;
        } catch (error) { 
            const err = error as AxiosError<ApiError>;
            throw new Error(
                err.response?.data?.detail || err.response?.data?.message || 'Failed to fetch categories'
            )
        }
    };


    // Get featured products
    async getFeaturedProducts(): Promise<AdminProduct[]> {
        try {
            const response = await axiosInstance.get<ProductResponse>(
                `${this.baseUrl}featured/`
            );

            return response.data.results;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            throw new Error(
                err.response?.data?.detail || err.response?.data?.message || 'Failed to fetch featured products'
            );
        }
    };


    // Search products
    async searchProducts(query: string): Promise<ProductResponse> {
        try {
            const response = await axiosInstance.get<ProductResponse>(
                `${this.baseUrl}`,
                {
                    params: { search: query }
                }
            );

            return response.data;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            throw new Error(
                err.response?.data?.detail || err.response?.data?.message || 'Failed to search products'
            )
        }
    };


    // Get products by category
    async getProductsByCategory(categorySlug: string): Promise<ProductResponse> {
        try {
            const response = await axiosInstance.get<ProductResponse>(
                `${this.baseUrl}`,
                {
                    params: { category: categorySlug }
                }
            );

            return response.data;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            throw new Error(
                err.response?.data?.detail || err.response?.data?.message || 'Failed to fetch products by category'
            )
        }
    };


    // Get products with price range
    async getProductsInPriceRange(minPrice: number, maxPrice: number): Promise<ProductResponse> {
        try {
            const response = await axiosInstance.get<ProductResponse>(
                this.baseUrl,
                {
                    params: {
                        min_price: minPrice,
                        max_price: maxPrice
                    }
                }
            );

            return response.data;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            throw new Error(
                err.response?.data?.detail || err.response?.data?.message || 'Failed to fetch products in price range'
            );
        }
    };


    // Get category by slug
    async getCategoryBySlug(slug: string): Promise<Category> {
        try {
            const response = await axiosInstance.get<Category>(
                `${this.categoryUrl}${slug}/`
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            throw new Error(
                err.response?.data?.detail || err.response?.data?.message || 'Failed to fetch category'
            );
        }
    };


    // Instant search (for autocomplete)
    async instantSearch(query: string): Promise<AdminProduct[]> {
        try {
            const response = await axiosInstance.get<AdminProduct[]>(
                `${this.baseUrl}instant_search/`,
                {
                    params: { query }
                }
            );
            return response.data;
        } catch (error) {
            const err = error as AxiosError<ApiError>;
            throw new Error(
                err.response?.data?.detail || err.response?.data?.message || 'Failed to perform instant search'
            )
        }
    };
};

export const productService = new ProductService();