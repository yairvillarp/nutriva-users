import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentService } from "../../services/appointments/services";
import type { CalEvent } from "@/types/appointments";

export const useGetAppointmentsByProfessional = (professionalId: string) => {
    return useQuery({
        queryKey: ["appointments", "professional", professionalId],
        queryFn: () => appointmentService.getAppointmentsByProfessional(professionalId),
        enabled: !!professionalId,
    });
};

export const useGetAppointmentsByPatient = (patientId: string) => {
    return useQuery({
        queryKey: ["appointments", "patient", patientId],
        queryFn: () => appointmentService.getAppointmentsByPatient(patientId),
        enabled: !!patientId,
    });
};

export const useGetAppointments = (params?: {
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
}) => {
    return useQuery({
        queryKey: ["appointments", "query", params],
        queryFn: () => appointmentService.getAppointments(params),
        enabled: true,
    });
};

export const useCreateAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (appointment: CalEvent) => {
            return appointmentService.createAppointment(appointment);
        },
        onSuccess: (data, variables) => {
            const professionalId = variables.professionalId;
            if (professionalId) {
                queryClient.invalidateQueries({
                    queryKey: ["appointments", "professional", professionalId]
                });
            }

            const patientId = variables.patientId;
            if (patientId) {
                queryClient.invalidateQueries({
                    queryKey: ["appointments", "patient", patientId]
                });
            }

            queryClient.invalidateQueries({
                queryKey: ["appointments"]
            });
        }
    });
};

export const useUpdateAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<CalEvent> }) => {
            return appointmentService.updateAppointment(id, updates);
        },
        onSuccess: (data, variables) => {
            if (variables.updates.professionalId) {
                queryClient.invalidateQueries({
                    queryKey: ["appointments", "professional", variables.updates.professionalId]
                });
            }

            if (variables.updates.patientId) {
                queryClient.invalidateQueries({
                    queryKey: ["appointments", "patient", variables.updates.patientId]
                });
            }

            queryClient.invalidateQueries({
                queryKey: ["appointments"]
            });
        }
    });
};

export const useDeleteAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => {
            return appointmentService.deleteAppointment(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["appointments"]
            });
        }
    });
};

export const useGetAvailableAppointments = (date: string, professionalId?: string) => {
    return useQuery({
        queryKey: ["appointments", "available", date, professionalId],
        queryFn: () => appointmentService.getAvailableAppointments(date, professionalId),
        enabled: !!date,
    });
};

export const useGetAppointmentStats = (professionalId?: string, startDate?: string, endDate?: string) => {
    return useQuery({
        queryKey: ["appointments", "stats", professionalId, startDate, endDate],
        queryFn: () => appointmentService.getAppointmentStats(professionalId, startDate, endDate),
        enabled: true,
    });
};
