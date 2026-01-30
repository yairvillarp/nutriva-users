import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/';
//const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.14:8080/';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            (config.headers as Record<string, string>)[
                "Authorization"
            ] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const message =
                error.response.data?.message || "Error en la petición";
            return Promise.reject(new Error(message));
        } else if (error.request) {
            return Promise.reject(
                new Error("No se recibió respuesta del servidor")
            );
        } else {
            return Promise.reject(new Error("Error al configurar la petición"));
        }
    }
);