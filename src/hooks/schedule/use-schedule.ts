import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduleService } from "../../services/schedules/services";
import type { CreateScheduleRequest } from "@/types/schedules";

export const useGetScheduleProfessional = (id: string) => {
    return useQuery({
        queryKey: ["schedules", id],
        queryFn: () => scheduleService.getScheduleProfessional(id),
        enabled: !!id,
    });
};

export const useCreateSchedule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (schedules: CreateScheduleRequest[]) =>
            scheduleService.createSchedule(schedules),
        onSuccess: (data, variables) => {
            const professionalId = variables[0]?.professionalId;
            if (professionalId) {
                queryClient.invalidateQueries({
                    queryKey: ["schedules", professionalId.toString()]
                });
            }
        },
    });
};

export const useGetEventTypes = () => {
    return useQuery({
        queryKey: ["eventTypes"],
        queryFn: () => scheduleService.getEventTypes(),
        staleTime: 1000 * 60 * 60, // 1 hora en cache
    });
};

export const useGetProfessionals = (search?: string) => {
    return useQuery({
        queryKey: ["professionals", search],
        queryFn: () => scheduleService.getProfessionals(search),
        enabled: true, // Siempre habilitado para AsyncSelect
        staleTime: 1000 * 60 * 5, // 5 minutos en cache
    });
};
