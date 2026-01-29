import { apiClient } from "../../config/apiClient";
import type { User, UpdateUserPayload } from "../../types/user";

export const userService = {
    getUser: async (id: number): Promise<User> => {
        const response = await apiClient.get<any>(`/users/${id}`);
        return response?.data.data;
    },

    updateUser: async (id: number, data: UpdateUserPayload): Promise<User> => {
        const response = await apiClient.post<User>(`/users/${id}`, data);
        return response.data;
    },
    updateUserPhone: async (params: { id: string; phone: string }): Promise<any> => {
        const response = await apiClient.post<any>(`/users/update-phone/${params.id}`, {
            phone: params.phone
        });
        return response.data;
    },
};
