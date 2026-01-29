import { apiClient } from "@/config/apiClient";
import type { Patient, PatientQueryResponse } from "@/types/patients";

export const patientsService = {
    queryPatients: async (params: {
        page: number;
        items_per_page: number;
        search?: string;
        sort?: string;
        order?: 'ASC' | 'DESC';
        [key: string]: any;
    }): Promise<PatientQueryResponse> => {
        const response = await apiClient.get<any>('/users/query', { params });
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
    },

    getPatient: async (id: string | number): Promise<Patient> => {
        const response = await apiClient.get<any>(`/users/${id}`);
        return response.data.data;
    }
};
