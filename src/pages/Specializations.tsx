import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { AddSpecializationModal } from "@/components/specializations/AddSpecializationModal";
import { useAddSpecialization, useDeleteSpecialization, useGetSpecializations, useUpdateSpecialization } from "@/hooks/specializations/specializations";
import type { Specialization, SpecializationFormData } from "@/types/Specialization";
import { EditSpecializationModal } from "@/components/specializations/EditSpecializationModal";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { uploadFile } from "@/hooks/comidas/comidas";
import { useGetProfessionalAreas } from "@/hooks/professional_areas/professionalAreas";

export function Specializations() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSpecialization, setSelectedSpecialization] = useState<Specialization | null>(null);
    const [file, setFile] = useState<File | null>();
    const [uploading, setUploading] = useState(false);
    const [filter, setFilter] = useState<string>("");

    const updateSpecialization = useUpdateSpecialization();
    const addSpecialization = useAddSpecialization();
    const deleteSpecialization = useDeleteSpecialization();

    // Obtener áreas profesionales para el select y los filtros
    const { data: professionalAreasData } = useGetProfessionalAreas();
    const professionalAreas = professionalAreasData?.data ?? [];

    // Crear filtros basados en las áreas profesionales
    const filtros = [
        { label: "Todas", active: true, color: "bg-blue-500", value: "" },
        ...professionalAreas.map((area) => ({
            label: area.name,
            active: false,
            color: "bg-green-500",
            value: area.id.toString()
        }))
    ];

    const [editFormData, setEditFormData] = useState<SpecializationFormData>({
        name: "",
        description: "",
        image: "",
        professional_area_id: undefined,
        status: "active",
    });

    const itemsPerPage = 10;

    // Obtener datos con paginación y filtro
    const { data: specializationsData, isLoading: isLoadingSpecializations, refetch } = useGetSpecializations({
        page: currentPage,
        items_per_page: itemsPerPage,
        search: searchTerm,
        professional_area_id: filter || undefined
    });

    // Datos y metadatos de paginación
    const specializations = specializationsData?.data ?? [];
    const pagination = specializationsData?.payload?.pagination;
    const totalPages = pagination?.last_page ?? 1;

    const handleEdit = (specialization: Specialization) => {
        setSelectedSpecialization(specialization);
        setEditFormData({
            name: specialization.name,
            description: specialization.description || "",
            image: specialization.image || "",
            professional_area_id: specialization.professional_area_id,
            status: specialization.status,
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedSpecialization) return;

        const saveData: any = {
            ...editFormData,
            id: selectedSpecialization.id
        };
        await updateSpecialization.mutateAsync(saveData);
        await refetch();
        setIsEditModalOpen(false);
        resetEditForm();
    };

    const handleSaveAdd = async () => {
        const saveData: any = { ...editFormData };
        await addSpecialization.mutateAsync(saveData);
        await refetch();
        setIsAddModalOpen(false);
        resetEditForm();
    };

    const handleDelete = async (specialization: Specialization) => {
        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta especialización?");
        if (confirmDelete) {
            try {
                await deleteSpecialization.mutateAsync({ id: specialization.id });
                await refetch();
                resetEditForm();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const resetEditForm = () => {
        setEditFormData({
            name: "",
            description: "",
            image: "",
            professional_area_id: undefined,
            status: "active",
        });
        setSelectedSpecialization(null);
        setFile(null);
    };

    const handleUpload = async (file: any): Promise<string | undefined> => {
        setUploading(true);
        try {
            const url = await uploadFile(file);
            return url;
        } catch (error) {
            console.error('Error uploading file:', error);
            return undefined;
        } finally {
            setUploading(false);
        }
    };

    // Función para manejar el cambio de filtro
    const handleToggleFiltro = (filtro: any) => {
        setFilter(filtro.value);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6 p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Especializaciones</h1>
                    <p className="text-gray-600">Gestiona las especializaciones disponibles en el sistema</p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary text-white shadow-md hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Especialización
                </Button>
            </div>

            {/* Búsqueda */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Buscar especialización..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
                {searchTerm && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchTerm("")}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        >
                            ×
                        </Button>
                    </div>
                )}
            </div>

            {/* Mostrar resultados de búsqueda */}
            {searchTerm && (
                <div className="text-sm text-gray-600">
                    {specializations.length === 0
                        ? `No se encontraron especializaciones que coincidan con "${searchTerm}"`
                        : `Se encontraron ${specializations.length} especialización(es) que coinciden con "${searchTerm}"`
                    }
                </div>
            )}

            {/* Filtros de áreas profesionales */}
            <div className="flex flex-wrap gap-2">
                {filtros.map((filtro, index) => (
                    <Badge
                        key={index}
                        variant={filter === filtro.value ? "default" : "outline"}
                        className={`${filter === filtro.value ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border-gray-300 hover:bg-gray-100"} cursor-pointer rounded-full px-4 py-1.5`}
                        onClick={() => handleToggleFiltro(filtro)}
                    >
                        {filtro.label}
                    </Badge>
                ))}
            </div>

            {/* Tabla de Especializaciones */}
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <CardTitle>Lista de Especializaciones</CardTitle>
                </CardHeader>
                <CardContent className="bg-white rounded-lg border shadow-sm p-0 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                <TableHead className="w-[100px]">Imagen</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Área Profesional</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha de Creación</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingSpecializations ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-16 text-gray-500">
                                        <div className="flex justify-center flex-col items-center">
                                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                                            Cargando...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : specializations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-16 text-gray-500">
                                        {searchTerm || filter ? "No se encontraron especializaciones con los filtros aplicados" : "No hay especializaciones disponibles"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                specializations.map((specialization) => (
                                    <TableRow key={specialization.id} className="hover:bg-gray-50/50">
                                        <TableCell>
                                            {specialization.image && (
                                                <img
                                                    src={specialization.image}
                                                    alt={specialization.name}
                                                    className="w-12 h-12 object-cover rounded-md bg-gray-100"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-gray-900">
                                            {specialization.name}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-gray-600">
                                            {specialization.description || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal">
                                                {specialization.ProfessionalArea?.name || "-"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={specialization.status === "active" ? "default" : "secondary"}
                                                className={
                                                    specialization.status === "active"
                                                        ? "bg-green-100 text-green-800 hover:bg-green-100 border-none shadow-none"
                                                        : "bg-gray-100 text-gray-800 hover:bg-gray-100 border-none shadow-none"
                                                }
                                            >
                                                {specialization.status === "active" ? "Activo" : "Inactivo"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-500">
                                            {specialization.createdAt ?
                                                new Date(specialization.createdAt).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })
                                                : "-"
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(specialization)}
                                                    className="h-8 w-8 text-gray-500 hover:text-primary hover:bg-primary/10"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(specialization)}
                                                    className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (currentPage > 1) setCurrentPage(currentPage - 1);
                                            }}
                                            className={
                                                currentPage === 1
                                                    ? "pointer-events-none opacity-50"
                                                    : "hover:bg-primary/10 hover:text-primary cursor-pointer"
                                            }
                                        />
                                    </PaginationItem>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((page) => {
                                            return (
                                                page <= 2 ||
                                                page > totalPages - 2 ||
                                                Math.abs(currentPage - page) <= 1
                                            );
                                        })
                                        .reduce((acc: (number | "...")[], page, i, arr) => {
                                            if (i > 0 && page - (arr[i - 1] as number) > 1) {
                                                acc.push("...");
                                            }
                                            acc.push(page);
                                            return acc;
                                        }, [])
                                        .map((page, i) => (
                                            <PaginationItem key={i}>
                                                {page === "..." ? (
                                                    <span className="px-2 text-gray-400">...</span>
                                                ) : (
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setCurrentPage(page as number);
                                                        }}
                                                        isActive={currentPage === page}
                                                        className={
                                                            currentPage === page
                                                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                                : "hover:bg-primary/10 hover:text-primary cursor-pointer"
                                                        }
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                )}
                                            </PaginationItem>
                                        ))}

                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                            }}
                                            className={
                                                currentPage === totalPages
                                                    ? "pointer-events-none opacity-50"
                                                    : "hover:bg-primary/10 hover:text-primary cursor-pointer"
                                            }
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modales */}
            <AddSpecializationModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                formData={editFormData}
                setFormData={setEditFormData}
                onSave={handleSaveAdd}
                file={file}
                setFile={setFile}
                uploadFile={handleUpload}
                uploading={uploading}
                setUploading={setUploading}
                professionalAreas={professionalAreas}
            />

            <EditSpecializationModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    resetEditForm();
                }}
                formData={editFormData}
                setFormData={setEditFormData}
                onSave={handleSaveEdit}
                file={file}
                setFile={setFile}
                uploadFile={handleUpload}
                uploading={uploading}
                setUploading={setUploading}
                professionalAreas={professionalAreas}
            />
        </div>
    );
}
