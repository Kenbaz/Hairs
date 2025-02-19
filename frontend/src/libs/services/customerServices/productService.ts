import axiosInstance from "@/src/utils/_axios";
import { AxiosError } from "axios";
import { InstantSearchResult, StoreProductDetails, StoreProduct, StoreProductResponse, Category, CategoryResponse, ProductFilters, ApiError, Review, ReviewResponse } from "@/src/types";


class ProductService {
  private readonly baseUrl = "/api/v1/products/";
  private readonly categoryUrl = "/api/v1/categories/";
  private readonly reviewsUrl = "/api/v1/reviews/";

  // Get all products with filters
  async getProducts(
    filters: Partial<ProductFilters>
  ): Promise<StoreProductResponse> {
    try {
      // convert filters to query params
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await axiosInstance.get<StoreProductResponse>(
        `${this.baseUrl}?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch products"
      );
    }
  }

  // Get single product by slug
  async getProductBySlug(slug: string): Promise<StoreProductDetails> {
    try {
      const response = await axiosInstance.get<StoreProductDetails>(
        `${this.baseUrl}${slug}/`
      );

      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch product"
      );
    }
  }

  // Get all categories
  async getCategories(): Promise<CategoryResponse> {
    try {
      const response = await axiosInstance.get<CategoryResponse>(this.categoryUrl);

      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch categories"
      );
    }
  }

  // Get featured products
  async getFeaturedProducts(): Promise<StoreProduct[]> {
    try {
      const response = await axiosInstance.get<StoreProductResponse>(
        `${this.baseUrl}featured/`
      );

      return response.data.results;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch featured products"
      );
    }
  }

  // Search products
  async searchProducts(query: string): Promise<StoreProductResponse> {
    try {
      const response = await axiosInstance.get<StoreProductResponse>(
        `${this.baseUrl}`,
        {
          params: { search: query },
        }
      );

      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to search products"
      );
    }
  }

  // Get products by category
  async getProductsByCategory(categorySlug: string): Promise<StoreProductResponse> {
    try {
      const response = await axiosInstance.get<StoreProductResponse>(
        `${this.baseUrl}`,
        {
          params: { category: categorySlug },
        }
      );

      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch products by category"
      );
    }
  }

  // Get products with price range
  async getProductsInPriceRange(
    minPrice: number,
    maxPrice: number
  ): Promise<StoreProductResponse> {
    try {
      const response = await axiosInstance.get<StoreProductResponse>(this.baseUrl, {
        params: {
          min_price: minPrice,
          max_price: maxPrice,
        },
      });

      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch products in price range"
      );
    }
  }

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
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch category"
      );
    }
  }

  // Instant search (for autocomplete)
  async instantSearch(query: string): Promise<InstantSearchResult[]> {
    try {
      const response = await axiosInstance.get<InstantSearchResult[]>(
        `${this.baseUrl}instant_search/`,
        {
          params: { query },
        }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to perform instant search"
      );
    }
  }

  // Related products
  async getRelatedProducts(
    productId: number,
    categoryId: number
  ): Promise<StoreProduct[]> {
    try {
      const response = await axiosInstance.get<StoreProductResponse>(
        `${this.baseUrl}`,
        {
          params: {
            category: categoryId,
            exclude: productId,
            page_size: 4,
          },
        }
      );

      return response.data.results;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch related products"
      );
    }
  }

  // Get product reviews
  async getProductReviews(
    productId: number,
    page: number = 1
  ): Promise<{
    reviews: Review[];
    total_reviews: number;
    average_rating: number;
  }> {
    try {
      const response = await axiosInstance.get<ReviewResponse>(
        `${this.reviewsUrl}`,
        {
          params: {
            product_id: productId,
            page,
          },
        }
      );
      return {
        reviews: response.data.results,
        total_reviews: response.data.count,
        average_rating: response.data.average_rating,
      };
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch reviews"
      );
    }
  }

  async submitReview(
    productId: number,
    rating: number,
    comment: string
  ): Promise<void> {
    try {
      await axiosInstance.post(`${this.reviewsUrl}`, {
        product_id: productId,
        rating,
        comment,
      });
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to submit review"
      );
    }
  }
};

export const productService = new ProductService();