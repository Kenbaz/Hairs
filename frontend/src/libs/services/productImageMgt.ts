import { ProductImage } from "@/src/types";
import axiosInstance from "@/src/utils/_axios";
import axios from "axios";


interface DeleteImagesResponse {
  message: string;
}


export const deleteImages = async (productId: number, imageIds: number[]): Promise<DeleteImagesResponse> => { 
    try {
        const response = await axiosInstance.post<DeleteImagesResponse>(
            `/api/v1/admin/products/${productId}/manage_image/`,
            {
                action: 'delete',
                image_ids: imageIds
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Delete images error:', error);
        throw error;
    }
};

export const setPrimaryImage = async (productId: number, imageId: number) => {
    return await axiosInstance.post(
        `/api/v1/admin/products/${productId}/manage_image/`,
        {
            action: 'set_primary',
            primary_image_id: imageId
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }
    );
};


export const uploadAdditionalImages = async (productId: number, images: File[]) => {
    try {
      console.log("Starting image upload...", images.length, "images");

      const formData = new FormData();

      images.forEach((image, index) => {
        console.log(`Appending image ${index + 1}:`, image.name);
        formData.append("product_images", image);
      });

      // Log the FormData content (for debugging)
      for (const pair of formData.entries()) {
        console.log("FormData entry:", pair[0], pair[1]);
      }

      const response = await axiosInstance.post<{
        message: string;
        images: ProductImage[]
      }>(`/api/v1/admin/products/${productId}/upload_images/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Upload response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Upload error:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.error || "Failed to upload images"
        );
      }
      throw error;
    }
}