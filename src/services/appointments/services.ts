import type {
    CalEvent,
    AppointmentsResponse,
    AppointmentResponse,
    AppointmentStatsResponse
} from "@/types/appointments";
import { apiClient } from "../../config/apiClient";

export const appointmentService = {
    createAppointment: async (appointment: CalEvent): Promise<AppointmentResponse> => {
        const response = await apiClient.put<AppointmentResponse>(
            `/appointments`,
            appointment
        );
        return response.data;
    },

    createAppointments: async (appointments: CalEvent[]): Promise<AppointmentsResponse> => {
        const response = await apiClient.put<AppointmentsResponse>(
            `/appointments/bulk`,
            { appointments }
        );
        return response.data;
    },

    getAppointments: async (params?: {
        page?: number;
        items_per_page?: number;
        search?: string;
        professionalId?: string;
        patientId?: string;
        eventType?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        sort?: string;
        order?: string;
    }): Promise<AppointmentsResponse> => {
        const response = await apiClient.get<AppointmentsResponse>(
            `/appointments/query`,
            { params }
        );
        return response.data;
    },

    getAppointmentsByProfessional: async (professionalId: string): Promise<AppointmentsResponse> => {
        const response = await apiClient.get<AppointmentsResponse>(
            `/appointments/professional/${professionalId}`
        );
        return response.data;
    },

    getAppointmentsByPatient: async (patientId: string): Promise<AppointmentsResponse> => {
        const response = await apiClient.get<AppointmentsResponse>(
            `/appointments/patient/${patientId}`
        );
        return response.data;
    },

    getAvailableAppointments: async (date: string, professionalId?: string): Promise<AppointmentsResponse> => {
        const params = professionalId ? { date, professionalId } : { date };
        const response = await apiClient.get<AppointmentsResponse>(
            `/appointments/available`,
            { params }
        );
        return response.data;
    },

    getAppointmentById: async (id: string): Promise<AppointmentResponse> => {
        const response = await apiClient.get<AppointmentResponse>(
            `/appointments/${id}`
        );
        return response.data;
    },

    updateAppointment: async (id: string, updates: Partial<CalEvent>): Promise<AppointmentResponse> => {
        const response = await apiClient.post<AppointmentResponse>(
            `/appointments/${id}`,
            updates
        );
        return response.data;
    },

    deleteAppointment: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await apiClient.delete<{ success: boolean; message: string }>(
            `/appointments/${id}`
        );
        return response.data;
    },

    getAppointmentStats: async (professionalId?: string, startDate?: string, endDate?: string): Promise<AppointmentStatsResponse> => {
        const params: any = {};
        if (professionalId) params.professionalId = professionalId;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await apiClient.get<AppointmentStatsResponse>(
            `/appointments/stats`,
            { params }
        );
        return response.data;
    },
};
