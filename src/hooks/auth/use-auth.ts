import { useMutation } from "@tanstack/react-query";
import { authService } from "../../services/auth/services";
import type { LoginCredentials, LoginResponse } from "../../types/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
    const navigate = useNavigate();

    const loginMutation = useMutation<LoginResponse, Error, LoginCredentials>({
        mutationFn: (credentials) => authService.login(credentials),
        onSuccess: (data) => {
            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("data", JSON.stringify(data));
            toast.success("¡Bienvenido!", {
                description: "Has iniciado sesión correctamente",
            });

            // Verificar los roles del usuario para redirección
            // const userRoles = data.roles || [];

            // Updated logic based on simplicity requested
            navigate("/home", { replace: true });
        },
        onError: (error) => {
            toast.error("Error al iniciar sesión", {
                description: error.message || "Credenciales inválidas",
            });
        },
    });

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("data");
        navigate("/login");
    };

    return {
        login: loginMutation.mutate,
        logout,
        isLoading: loginMutation.isPending,
        error: loginMutation.error,
    };
};
