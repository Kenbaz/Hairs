import axiosInstance from "@/src/utils/_axios";
import axios from "axios";
import { AdminProduct, ProductFilters, ProductResponse } from "@/src/types";
import { deleteImages, setPrimaryImage, uploadAdditionalImages } from "./productImageMgt";


class AdminProductService {
    async getProducts(filters?: ProductFilters): Promise<ProductResponse> {
      try {
          const response = await axiosInstance.get('/api/v1/admin/products/',{
            params: filters
        });
        return response.data;
      } catch (error) {
        throw error;
      }    
    };


    async getProduct(id: number): Promise<AdminProduct> {
    const response = await axiosInstance.get(`/api/v1/admin/products/${id}/`);
    return response.data;
    }


    async createProduct(productData: FormData): Promise<AdminProduct> {
        console.log("Making request to create product...");
        try {
          // Log FormData contents
          console.log("FormData contents:");
          for (const [key, value] of productData.entries()) {
            if (value instanceof File) {
              console.log(key, value.name, value.type, value.size);
            } else {
              console.log(key, value);
            }
          }

          const response = await axiosInstance.post<AdminProduct>(
            "/api/v1/admin/products/",
            productData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
           console.log("CreateProduct response:", response.data);
          return response.data;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error("Create product error:", error);
            console.error("Server response:", error.response?.data);
          }
          throw error;
        }
    };


    async updateProduct(id: number, productData: FormData): Promise<AdminProduct> {
        const response = await axiosInstance.put<AdminProduct>(`/api/v1/admin/products/${id}/`, productData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    };


    async deleteProduct(id: number): Promise<void> {
        await axiosInstance.delete(`/api/v1/admin/products/${id}/`);
    };


    async updateStock(id: number, quantity: number, notes?: string): Promise<AdminProduct> {
        const response = await axiosInstance.post(`/api/v1/admin/products/${id}/update_stock/`, {
            stock: quantity,
            notes
        });
        return response.data;
    };


    async toggleFeatured(id: number): Promise<AdminProduct> {
        const response = await axiosInstance.post(`/api/v1/admin/products/${id}/toggle_featured/`);
        return response.data;
    };


    async exportProducts(format: 'csv' | 'excel' | 'pdf'): Promise<Blob> {
        const response = await axiosInstance.get('/api/v1/admin/products/export/', {
            params: { format },
            responseType: 'blob'
        });
        return response.data;
    };
    
  
    async deleteProductImage(productId: number, imageIds: number[]) {
      return await deleteImages(productId, imageIds);
    };
    
  
    async setPrimaryImage(productId: number, imageId: number) {
      return await setPrimaryImage(productId, imageId);
    };
    
  
    async uploadAdditionalImages(productId: number, images: File[]) {
      return await uploadAdditionalImages(productId, images);
    };
};


export const adminProductService = new AdminProductService();