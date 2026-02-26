import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/auth/use-auth";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check for token in URL query params (Legacy/Backend Redirect support)
    const params = new URLSearchParams(location.search);
    let token = params.get("token") || params.get("accessToken");

    if (token) {
      localStorage.setItem("token", token);
      toast.success("Inicio de sesión exitoso");
      navigate("/home", { replace: true });
    }
  }, [location, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  const handleGoogleLogin = () => {
    // Frontend-initiated Google OAuth Implicit Flow
    const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log("VITE_GOOGLE_CLIENT_ID:", client_id);

    if (!client_id) {
      toast.error("Falta configuración", {
        description: "VITE_GOOGLE_CLIENT_ID no está definido en el entorno."
      });
      return;
    }

    const redirect_uri = "https://users.nutriva.io/home";
    const scope = "email profile openid";
    const response_type = "token"; // Implicit flow to get access_token directly

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}`;

    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Image/Brand */}
      <div className="hidden lg:block bg-gradient-to-br from-green-500 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-white p-12">
          <div className="h-20 w-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/30 transform rotate-12">
            <div className="h-10 w-10 border-2 border-white rounded-sm transform rotate-45" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Bienvenido a Nutriva</h1>
          <p className="text-lg text-emerald-50 text-center max-w-md">
            Gestiona tus pacientes, dietas y citas desde un solo lugar. La plataforma integral para nutricionistas.
          </p>

          {/* Aesthetic circles */}
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-400/20 rounded-full blur-3xl opacity-50" />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-8 bg-gray-50/50">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Iniciar Sesión</h2>
            <p className="mt-2 text-sm text-gray-500">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    placeholder="nombre@ejemplo.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                    Contraseña
                  </label>
                  <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-500 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 hover:bg-gray-100 p-0.5 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-base shadow-lg shadow-emerald-600/20"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-500 font-medium">O continúa con</span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full h-11 border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all group"
            onClick={handleGoogleLogin}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-gray-600 group-hover:text-gray-900">Google</span>
          </Button>

          <div className="text-center text-sm text-gray-500">
            ¿No tienes una cuenta?{" "}
            <a href="#" className="font-semibold text-emerald-600 hover:text-emerald-500 underline underline-offset-4">
              Regístrate gratis
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
