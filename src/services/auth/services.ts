import { apiClient } from "../../config/apiClient";
import type { LoginResponse, LoginCredentials } from "../../types/auth";

export const authService = {
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>(
            "/auth/signin",
            credentials
        );
        return response.data;
    },
    googleLogin: async (token: string): Promise<LoginResponse> => {
        const response = await apiClient.get<LoginResponse>(
            `/auth/google?code=${token}`
        );
        return response.data;
    },
};
