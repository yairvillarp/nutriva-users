import { apiClient } from "@/config/apiClient";
import type { AnalyticData } from "@/types/analyticData";

export const analyticDataService = {
    getAll: async (patientId: number, page: number = 1, limit: number = 10, startDate?: string, endDate?: string) => {
        let url = `/analytic/${patientId}?page=${page}&limit=${limit}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;

        const response = await apiClient.get(url);
        return response.data;
    },

    getAllForCharts: async (patientId: number, startDate?: string, endDate?: string) => {
        let url = `/analytic/charts/${patientId}`;
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        if (params.toString()) url += `?${params.toString()}`;

        const response = await apiClient.get(url);
        return response.data;
    },

    create: async (data: Omit<AnalyticData, "id">) => {
        const response = await apiClient.post(
            `/analytic`,
            data
        );
        return response.data;
    },

    delete: async (id: number) => {
        const response = await apiClient.delete(
            `/analytic/${id}`
        );
        return response.data;
    }
};
