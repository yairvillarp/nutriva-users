import { useQuery, useMutation } from "@tanstack/react-query";
import { userService } from "../../services/user/services";

export const useUpdateUserPhone = () => {
    return useMutation<any, Error, {
        id: string;
        phone: string;
    }>({
        mutationFn: (params) => userService.updateUserPhone(params),
    });
};

export const useGetCurrentUser = () => {
    return useQuery({
        queryKey: ["currentUser"],
        queryFn: () => {
            const userData = localStorage.getItem('data');
            if (!userData) throw new Error('Usuario no autenticado');

            const user = JSON.parse(userData);
            return userService.getUser(user.id);
        },
        enabled: true,
    });
};
