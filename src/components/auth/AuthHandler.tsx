import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/services/auth/services";

export const AuthHandler = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Check for access token in URL Hash (Google Implicit Flow)
        // Usually: #access_token=...&token_type=Bearer&expires_in=...
        if (location.hash) {
            const hashParams = new URLSearchParams(location.hash.substring(1)); // remove #
            const googleAccessToken = hashParams.get("access_token");

            if (googleAccessToken) {
                authService.googleLogin(googleAccessToken)
                    .then(data => {
                        localStorage.setItem("token", data.accessToken);
                        localStorage.setItem("data", JSON.stringify(data));
                        toast.success("Inicio de sesión exitoso con Google");
                        
                        // Clear the hash and navigate to /home securely
                        navigate("/home", { replace: true });
                    })
                    .catch(err => {
                        console.error("Google Login Error:", err);
                        toast.error("Error al iniciar sesión con Google", {
                            description: err.message || "No se pudo validar el token con el servidor."
                        });
                        // If error, redirect to login to try again
                        navigate("/login", { replace: true });
                    });
            }
        }
    }, [location, navigate]);

    return null; // This component doesn't render anything
};
