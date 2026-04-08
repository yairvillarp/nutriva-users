import { apiClient } from "@/config/apiClient";

const API_URL = "/api/comments";

export const commentsService = {
    getAll: async () => {
        const response = await apiClient.get(API_URL);
        return response.data;
    },
    getByPatientId: async (patientId: number) => {
        const response = await apiClient.get(`${API_URL}/patient/${patientId}`);
        return response.data;
    },
    create: async (data: { 
        patientId: number; 
        breakfast: any[];
        lunch: any[];
        snack: any[];
        dinner: any[];
        daysOfWeek: string[] 
    }) => {
        const response = await apiClient.post(API_URL, data);
        return response.data;
    },
    update: async (id: number, data: { 
        breakfast?: any[];
        lunch?: any[];
        snack?: any[];
        dinner?: any[];
        daysOfWeek?: string[] 
    }) => {
        const response = await apiClient.put(`${API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await apiClient.delete(`${API_URL}/${id}`);
        return response.data;
    }
};

