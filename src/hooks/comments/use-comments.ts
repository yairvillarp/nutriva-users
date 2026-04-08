import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsService } from "@/services/comments/services";

export const useComments = (patientId?: number) => {
    const queryClient = useQueryClient();

    const commentsQuery = useQuery({
        queryKey: ["comments", patientId],
        queryFn: () => patientId ? commentsService.getByPatientId(patientId) : Promise.resolve([]),
        enabled: !!patientId,
    });

    const createMutation = useMutation({
        mutationFn: commentsService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comments", patientId] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { 
            id: number; 
            data: { 
                breakfast?: any[];
                lunch?: any[];
                snack?: any[];
                dinner?: any[];
                daysOfWeek?: string[] 
            } 
        }) =>
            commentsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comments", patientId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: commentsService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comments", patientId] });
        },
    });

    return {
        commentsQuery,
        createMutation,
        updateMutation,
        deleteMutation,
    };
};
