import { useState, useEffect } from "react";
import { useUser } from "../../hooks/user/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Upload } from "lucide-react";
import { filesService } from "../../services/files/services";

interface EdithUserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: number;
}

interface FormErrors {
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    password?: string;
    confirmarpassword?: string;
    general?: string;
}

export function EdithUserProfileModal({ isOpen, onClose, userId }: EdithUserProfileModalProps) {
    const { user, updateUser, isUpdating, refetch } = useUser(userId);
    const [file, setFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: "",
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirmarpassword: "",
        avatar: null as string | null,
    });

    // Populate form data when user data is available
    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                id: user.id?.toString() || "", // Convert to string safely if needed
                username: user.username || "",
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                password: "",
                confirmarpassword: "",
                avatar: user.avatar || null,
            });
            setAvatarUrl(user.avatar || null);
        }
    }, [user, isOpen]);

    // Reset when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setTouched({});
            if (userId) {
                refetch();
            }
        } else {
            setFormData({
                id: "",
                username: "",
                first_name: "",
                last_name: "",
                email: "",
                password: "",
                confirmarpassword: "",
                avatar: null,
            });
            setAvatarUrl(null);
            setFile(null);
        }
    }, [isOpen, userId, refetch]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateForm();
    };

    const hasPasswordChanged = () => {
        return formData.password !== "";
    };

    const hasAvatarChanged = () => {
        return avatarUrl !== null && avatarUrl !== (user?.avatar || null);
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.username?.trim()) newErrors.username = "El nombre de usuario es requerido";
        if (!formData.first_name?.trim()) newErrors.first_name = "El nombre es requerido";
        if (!formData.last_name?.trim()) newErrors.last_name = "El apellido es requerido";
        if (!formData.email?.trim()) newErrors.email = "El email es requerido";

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "El formato del email no es válido";
        }

        if (hasPasswordChanged()) {
            if (formData.password.length < 6) {
                newErrors.password = "La contraseña debe tener al menos 6 caracteres";
            }

            if (formData.password !== formData.confirmarpassword) {
                newErrors.confirmarpassword = "Las contraseñas no coinciden";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormValid = () => {
        const basicFieldsValid =
            formData.username &&
            formData.first_name &&
            formData.last_name &&
            formData.email &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

        const passwordValid = !hasPasswordChanged() ||
            (formData.password.length >= 6 &&
                formData.password === formData.confirmarpassword);

        const noValidationErrors = Object.keys(errors).length === 0;

        return basicFieldsValid && passwordValid && noValidationErrors;
    };

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const response = await filesService.uploadImage(file);
            if (response && response.Location) {
                setAvatarUrl(response.Location);
                setFormData(prev => ({ ...prev, avatar: response.Location }));
            }
        } catch (error) {
            console.error("Error al subir la imagen:", error);
            setErrors(prev => ({ ...prev, general: "Error al subir la imagen" }));
        } finally {
            setUploading(false);
        }
    };

    const fileChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setErrors(prev => ({ ...prev, general: undefined }));
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        const userDataToSend: any = {
            id: formData.id,
            username: formData.username,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            ...(hasPasswordChanged() && { password: formData.password }),
            ...(hasAvatarChanged() && { avatar: avatarUrl ? avatarUrl : undefined }),
        };

        try {
            await updateUser(userDataToSend);
            onClose();
        } catch (error: any) {
            if (error.response?.data?.message === 'Email Already Exists') {
                setErrors(prev => ({ ...prev, email: "Este email ya está en uso" }));
            } else {
                setErrors(prev => ({ ...prev, general: "Error al actualizar el usuario" }));
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Editar perfil</DialogTitle>
                </DialogHeader>

                {errors.general && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {errors.general}
                    </div>
                )}

                <div className="space-y-6 py-4">
                    {/* Avatar */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700">Avatar</Label>
                        <div className="mt-2 flex items-center gap-4">
                            <Avatar className="h-16 w-16 bg-blue-500">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <AvatarFallback className="bg-blue-500 text-white">
                                        <User className="h-8 w-8" />
                                    </AvatarFallback>
                                )}
                            </Avatar>
                        </div>
                    </div>

                    {/* Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                                Nombre de usuario *
                            </Label>
                            <Input
                                id="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={(e) => handleInputChange("username", e.target.value)}
                                onBlur={() => handleBlur("username")}
                                className={errors.username && touched.username ? "border-red-500" : ""}
                            />
                            {errors.username && touched.username && (
                                <p className="text-sm text-red-500 mt-1">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                                Nombre *
                            </Label>
                            <Input
                                id="first_name"
                                placeholder="First Name"
                                value={formData.first_name}
                                onChange={(e) => handleInputChange("first_name", e.target.value)}
                                onBlur={() => handleBlur("first_name")}
                                className={errors.first_name && touched.first_name ? "border-red-500" : ""}
                            />
                            {errors.first_name && touched.first_name && (
                                <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                                Apellido *
                            </Label>
                            <Input
                                id="last_name"
                                placeholder="Last Name"
                                value={formData.last_name}
                                onChange={(e) => handleInputChange("last_name", e.target.value)}
                                onBlur={() => handleBlur("last_name")}
                                className={errors.last_name && touched.last_name ? "border-red-500" : ""}
                            />
                            {errors.last_name && touched.last_name && (
                                <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                Email *
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                onBlur={() => handleBlur("email")}
                                className={errors.email && touched.email ? "border-red-500" : ""}
                            />
                            {errors.email && touched.email && (
                                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Contraseña
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => handleInputChange("password", e.target.value)}
                                onBlur={() => handleBlur("password")}
                                className={errors.password && touched.password ? "border-red-500" : ""}
                            />
                            {errors.password && touched.password && (
                                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                                Deje vacío si no desea cambiar la contraseña. Mínimo 6 caracteres.
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="confirmarpassword" className="text-sm font-medium text-gray-700">
                                Confirmar contraseña
                            </Label>
                            <Input
                                id="confirmarpassword"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Password confirmation"
                                value={formData.confirmarpassword}
                                onChange={(e) => handleInputChange("confirmarpassword", e.target.value)}
                                onBlur={() => handleBlur("confirmarpassword")}
                                className={errors.confirmarpassword && touched.confirmarpassword ? "border-red-500" : ""}
                            />
                            {errors.confirmarpassword && touched.confirmarpassword && (
                                <p className="text-sm text-red-500 mt-1">{errors.confirmarpassword}</p>
                            )}
                        </div>
                    </div>

                    {/* Avatar - Campo de carga de archivo */}
                    <div>
                        <Label htmlFor="avatar" className="text-sm font-medium text-gray-700">
                            Actualizar Avatar
                        </Label>
                        <div className="mt-1 flex gap-2">
                            <Input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                onChange={fileChanged}
                                className="flex-1"
                            />
                            {file && (
                                <Button
                                    type="button"
                                    onClick={() => handleUpload(file)}
                                    disabled={!file || uploading}
                                    className="bg-[#4E73DF] hover:bg-[#3B5FBF] text-white"
                                >
                                    {uploading ? (
                                        <span className="flex items-center gap-2">
                                            <Upload className="h-4 w-4 animate-bounce" />
                                            Subiendo...
                                        </span>
                                    ) : (
                                        "Subir"
                                    )}
                                </Button>
                            )}
                        </div>
                        {hasAvatarChanged() && (
                            <p className="text-xs text-green-600 mt-1">
                                Avatar subido correctamente. Se actualizará al guardar los cambios.
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isUpdating}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        disabled={!isFormValid() || isUpdating}
                    >
                        {isUpdating ? "Actualizando..." : "Actualizar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
