import { apiClient } from "@/config/apiClient";
import type { ClinicalHistory } from "@/types/clinicalHistory";

export const clinicalHistoryService = {
    getPatientHistory: async (patientId: number | string): Promise<ClinicalHistory | null> => {
        try {
            const response = await apiClient.get<{ data: ClinicalHistory | null }>(`/clinical-history/${patientId}`);
            return response.data.data;
        } catch (error) {
            console.error("Error fetching clinical history:", error);
            return null;
        }
    },

    savePatientHistory: async (history: ClinicalHistory): Promise<ClinicalHistory> => {
        const response = await apiClient.post<{ data: ClinicalHistory }>('/clinical-history', history);
        return response.data.data;
    },

    getCountries: async () => {
        const response = await apiClient.get('/clinical-history/countries');
        return response.data.data;
    },

    queryHistories: async (params: {
        page: number;
        items_per_page: number;
        search?: string;
    }): Promise<{ data: ClinicalHistory[]; payload: { pagination: any } }> => {
        const response = await apiClient.get<any>('/clinical-history/query', { params });
        return response.data;
    },

    queryMyPatients: async (params: {
        page: number;
        items_per_page: number;
        search?: string;
    }) => {
        const response = await apiClient.get<any>('/clinical-history/my-patients', { params });
        const { data, all_user_ids, payload } = response.data;

        return {
            data,
            all_user_ids,
            payload: {
                pagination: {
                    total_items: payload.pagination.total,
                    total_pages: payload.pagination.last_page,
                    current_page: payload.pagination.page,
                    items_per_page: payload.pagination.items_per_page
                }
            }
        };
    }
};
