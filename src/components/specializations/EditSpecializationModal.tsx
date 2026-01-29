import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import type { ProfessionalArea, SpecializationFormData } from "@/types/Specialization";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Upload } from "lucide-react";



interface EditSpecializationModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: SpecializationFormData;
    setFormData: (data: SpecializationFormData) => void;
    onSave: () => void;
    file: File | null | undefined;
    setFile: (file: File | null) => void;
    uploadFile: (file: File) => Promise<string | undefined>;
    uploading: boolean;
    setUploading: (uploading: boolean) => void;
    professionalAreas: ProfessionalArea[];
}

export function EditSpecializationModal({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSave,

    setFile,
    uploadFile,
    uploading,
    professionalAreas
}: EditSpecializationModalProps) {

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            const url = await uploadFile(selectedFile);
            if (url) {
                setFormData({ ...formData, image: url });
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Especialización</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                            Nombre
                        </Label>
                        <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-description" className="text-right">
                            Descripción
                        </Label>
                        <div className="col-span-3">
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-area" className="text-right">
                            Área
                        </Label>
                        <div className="col-span-3">
                            <Select
                                id="edit-area"
                                value={formData.professional_area_id || ""}
                                onChange={(e) => setFormData({ ...formData, professional_area_id: Number(e.target.value) })}
                            >
                                <option value="" disabled>Seleccione un área</option>
                                {professionalAreas.map((area) => (
                                    <option key={area.id} value={area.id}>
                                        {area.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-image" className="text-right">
                            Imagen
                        </Label>
                        <div className="col-span-3">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('edit-file-upload')?.click()}
                                    disabled={uploading}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {uploading ? "Subiendo..." : "Subir Imagen"}
                                </Button>
                                <input
                                    id="edit-file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                />
                            </div>
                            {formData.image && (
                                <img src={formData.image} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-md" />
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-status" className="text-right">
                            Estado
                        </Label>
                        <div className="col-span-3">
                            <Select
                                id="edit-status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                            >
                                <option value="active">Activo</option>
                                <option value="inactive">Inactivo</option>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={onSave} disabled={uploading}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
