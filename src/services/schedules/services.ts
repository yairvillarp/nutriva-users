import type { SchedulesResponse, CreateScheduleRequest, ProfessionalsResponse, EventTypesResponse } from "@/types/schedules";
import { apiClient } from "../../config/apiClient";

export const scheduleService = {
    getScheduleProfessional: async (id: string): Promise<SchedulesResponse> => {
        const response = await apiClient.get<SchedulesResponse>(
            `/schedules/professional/${id}`
        );
        return response.data;
    },

    createSchedule: async (schedules: CreateScheduleRequest[]): Promise<any> => {
        const response = await apiClient.put(
            `/schedules`,
            { schedules }
        );
        return response.data;
    },

    getEventTypes: async (): Promise<EventTypesResponse> => {
        const response = await apiClient.get<EventTypesResponse>(
            `/schedules/events-type`
        );
        return response.data;
    },

    getProfessionals: async (search?: string): Promise<ProfessionalsResponse> => {
        const params = search ? { search } : {};
        const response = await apiClient.get<ProfessionalsResponse>(
            `/users/professionals`,
            { params }
        );
        return response.data;
    },
};
