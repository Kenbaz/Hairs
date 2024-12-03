import axiosInstance from "@/src/utils/_axios";


export const deleteImages = async (productId: number, imageIds: number[]) => {
    return await axiosInstance.post(`/api/v1/admin/products/${productId}/manage_image/`, {
        action: 'delete',
        image_ids: imageIds
    });
};


export const setPrimaryImage = async (productId: number, imageId: number) => {
    return await axiosInstance.post(`/api/v1/admin/products/${productId}/manage_images/`, {
        action: 'set_primary',
        primary_image_id: imageId
    });
};


export const uploadAdditionalImages = async (productId: number, images: File[]) => {
    const formData = new FormData();
    images.forEach(image => {
        formData.append('product_images', image);
    });

    return await axiosInstance.post(
        `/api/v1/admin/products/${productId}/upload_images/`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
}