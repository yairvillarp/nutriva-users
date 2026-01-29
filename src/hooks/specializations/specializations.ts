import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MockApi } from "@/services/mockApi";
import { type Specialization, type SpecializationFormData } from "@/types/Specialization";

export function useGetSpecializations(params: { page: number; items_per_page: number; search: string; professional_area_id?: string }) {
    return useQuery({
        queryKey: ["specializations", params],
        queryFn: () => MockApi.getSpecializations(params),
    });
}

export function useAddSpecialization() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SpecializationFormData) => MockApi.addSpecialization(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["specializations"] });
        },
    });
}

export function useUpdateSpecialization() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Specialization & { id: number }) => MockApi.updateSpecialization(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["specializations"] });
        },
    });
}

export function useDeleteSpecialization() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { id: number }) => MockApi.deleteSpecialization(vars.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["specializations"] });
        },
    });
}
