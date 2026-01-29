import { apiClient } from "@/config/apiClient";

export interface UploadedFile {
    Location: string;
    key: string;
    Key: string;
    Bucket: string;
    ETag: string;
}

export interface ImageUploadResponse {
    data: UploadedFile[];
}

export const filesService = {
    uploadImage: async (
        file: File,
        type: string = 'file'
    ): Promise<UploadedFile[]> => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', type);

        const response = await apiClient.post<ImageUploadResponse>(
            '/api/upload',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            }
        );
        return response.data.data;
    }
};
