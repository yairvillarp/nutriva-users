import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../../services/user/services";
import type { UpdateUserPayload } from "../../types/user";
import { toast } from "sonner";

export const useUser = (userId?: number) => {
    const queryClient = useQueryClient();

    const userQuery = useQuery({
        queryKey: ["user", userId],
        queryFn: () => userService.getUser(userId!),
        enabled: !!userId,
    });

    const updateUserMutation = useMutation({
        mutationFn: (data: UpdateUserPayload) => {
            if (!userId) throw new Error("User ID is required");
            return userService.updateUser(userId, data);
        },
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(["user", userId], updatedUser);

            // Provide feedback
            toast.success("Perfil actualizado correctamente");

            // Optionally update local storage if it's the current user to keep sync (though better to rely on query cache)
            const storedData = localStorage.getItem('data');
            if (storedData) {
                const currentData = JSON.parse(storedData);
                if (currentData.id === updatedUser.id) {
                    // Update relevant fields in local storage to avoid flashing old data on reload if components use LS
                    const newStorageData = {
                        ...currentData,
                        username: updatedUser.username,
                        email: updatedUser.email,
                        avatar: updatedUser.avatar
                    };
                    localStorage.setItem('data', JSON.stringify(newStorageData));
                }
            }
        },
        onError: (error: any) => {
            console.error("Error updating user:", error);
            toast.error("Error al actualizar perfil", {
                description: error.response?.data?.message || "Ha ocurrido un error inesperado"
            });
        },
    });

    return {
        user: userQuery.data,
        isLoading: userQuery.isLoading,
        error: userQuery.error,
        updateUser: updateUserMutation.mutateAsync,
        isUpdating: updateUserMutation.isPending,
        refetch: userQuery.refetch,
    };
};
