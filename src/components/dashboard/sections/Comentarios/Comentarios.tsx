import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Edit2, Calendar, MessageSquare, User, ChevronRight, Check } from "lucide-react";
import { useComments } from "@/hooks/comments/use-comments";
import { useMyPatients } from "@/hooks/patients/use-my-patients";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo"
];

const MEALS = [
    { id: "breakfast", label: "Desayuno", color: "bg-orange-50 text-orange-700 border-orange-100" },
    { id: "lunch", label: "Almuerzo", color: "bg-blue-50 text-blue-700 border-blue-100" },
    { id: "snack", label: "Merienda", color: "bg-purple-50 text-purple-700 border-purple-100" },
    { id: "dinner", label: "Cena", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
];

export function Comentarios() {
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [form, setForm] = useState({
        breakfast: "",
        lunch: "",
        snack: "",
        dinner: "",
        daysOfWeek: [] as string[]
    });

    // Patients Hook
    const { patients, isLoading: isLoadingPatients, setSearch: setHookSearch } = useMyPatients(100);

    // Filter patients locally for immediate feedback, but use hook for deeper search
    useEffect(() => {
        setHookSearch(searchTerm);
    }, [searchTerm, setHookSearch]);

    const filteredPatients = useMemo(() => {
        return patients.filter((p: any) =>
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [patients, searchTerm]);

    // Comments Hook
    const { commentsQuery, createMutation, updateMutation, deleteMutation } = useComments(selectedPatient?.id);
    const comments = commentsQuery.data || [];

    const handleToggleDay = (day: string) => {
        setForm(prev => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day]
        }));
    };

    const handleSave = async () => {
        if (!selectedPatient) return;
        if (form.daysOfWeek.length === 0) {
            toast.error("Selecciona al menos un día de la semana");
            return;
        }
        
        const hasContent = form.breakfast.trim() || form.lunch.trim() || form.snack.trim() || form.dinner.trim();
        if (!hasContent) {
            toast.error("Debes completar al menos una sección de comida");
            return;
        }

        const dataToSave = {
            patientId: selectedPatient.id,
            breakfast: form.breakfast.trim() ? [{ text: form.breakfast.trim() }] : [],
            lunch: form.lunch.trim() ? [{ text: form.lunch.trim() }] : [],
            snack: form.snack.trim() ? [{ text: form.snack.trim() }] : [],
            dinner: form.dinner.trim() ? [{ text: form.dinner.trim() }] : [],
            daysOfWeek: form.daysOfWeek
        };

        try {
            if (isEditing) {
                await updateMutation.mutateAsync({ id: isEditing, data: dataToSave });
                toast.success("Comentario actualizado correctamente");
            } else {
                await createMutation.mutateAsync(dataToSave);
                toast.success("Comentario agregado correctamente");
            }
            handleCancel();
        } catch (error) {
            toast.error("Error al guardar el comentario");
        }
    };

    const handleEdit = (comment: any) => {
        setIsEditing(comment.id);
        setForm({
            breakfast: comment.breakfast?.[0]?.text || "",
            lunch: comment.lunch?.[0]?.text || "",
            snack: comment.snack?.[0]?.text || "",
            dinner: comment.dinner?.[0]?.text || "",
            daysOfWeek: comment.daysOfWeek || []
        });
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este comentario?")) return;
        try {
            await deleteMutation.mutateAsync(id);
            toast.success("Comentario eliminado");
        } catch (error) {
            toast.error("Error al eliminar el comentario");
        }
    };

    const handleCancel = () => {
        setIsEditing(null);
        setForm({
            breakfast: "",
            lunch: "",
            snack: "",
            dinner: "",
            daysOfWeek: []
        });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] gap-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Módulo de Comentarios</h1>
                    <p className="text-muted-foreground mt-1">Gestiona los comentarios semanales para tus pacientes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
                {/* Panel de Pacientes */}
                <Card className="lg:col-span-4 flex flex-col overflow-hidden border-none shadow-xl bg-white/50 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-4">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <User className="w-5 h-5 text-primary" />
                            Listado de Pacientes
                        </CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o email..."
                                className="pl-9 bg-white/80 border-primary/10 focus:border-primary/30 transition-all rounded-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isLoadingPatients ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p>Cargando pacientes...</p>
                            </div>
                        ) : filteredPatients.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No se encontraron pacientes.
                            </div>
                        ) : (
                            filteredPatients.map((patient: any) => (
                                <div
                                    key={patient.id}
                                    onClick={() => setSelectedPatient(patient)}
                                    className={cn(
                                        "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent",
                                        selectedPatient?.id === patient.id
                                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                                            : "hover:bg-white hover:border-primary/10 hover:shadow-md"
                                    )}
                                >
                                    <Avatar className="h-10 w-10 ring-2 ring-white/50">
                                        <AvatarImage src={patient.avatar} />
                                        <AvatarFallback className={cn(
                                            "font-bold",
                                            selectedPatient?.id === patient.id ? "bg-white/20" : "bg-primary/10 text-primary"
                                        )}>
                                            {patient.name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold text-sm truncate">{patient.name}</p>
                                        <p className={cn(
                                            "text-xs truncate",
                                            selectedPatient?.id === patient.id ? "text-white/70" : "text-muted-foreground"
                                        )}>{patient.email}</p>
                                    </div>
                                    <ChevronRight className={cn(
                                        "w-4 h-4 transition-transform group-hover:translate-x-1",
                                        selectedPatient?.id === patient.id ? "text-white" : "text-primary/30"
                                    )} />
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Formulario y Listado de Comentarios */}
                <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden overflow-y-auto pr-2">
                    {!selectedPatient ? (
                        <Card className="flex-1 flex flex-col items-center justify-center border-dashed border-2 bg-gray-50/50">
                            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                                <MessageSquare className="w-12 h-12 text-primary/20" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-400">Selecciona un paciente</h3>
                            <p className="text-gray-400 max-w-xs text-center">Para gestionar los comentarios semanales, primero debes elegir a alguien de la lista.</p>
                        </Card>
                    ) : (
                        <>
                            {/* Formulario ABM */}
                            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm shrink-0">
                                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-primary">
                                            <AvatarImage src={selectedPatient.avatar} />
                                            <AvatarFallback className="bg-primary text-white font-black">{selectedPatient.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-xl font-bold">{isEditing ? "Editar Comentarios" : "Nuevos Comentarios"}</CardTitle>
                                            <p className="text-sm text-muted-foreground">Asignado a: <span className="font-semibold text-primary">{selectedPatient.name}</span></p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-white/50 border-primary/20 text-primary px-3 py-1">
                                        ID: {selectedPatient.id}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    {/* Selección de Días */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Días de la semana</label>
                                        <div className="flex flex-wrap gap-2">
                                            {DAYS_OF_WEEK.map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => handleToggleDay(day)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-2",
                                                        form.daysOfWeek.includes(day)
                                                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                                            : "bg-white text-gray-600 border-gray-200 hover:border-primary/30"
                                                    )}
                                                >
                                                    {form.daysOfWeek.includes(day) && <Check className="w-3.5 h-3.5" />}
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sección de Comidas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {MEALS.map(meal => (
                                            <div key={meal.id} className="space-y-2">
                                                <label className={cn("text-xs font-bold uppercase tracking-wider px-2 py-1 rounded inline-block", meal.color)}>
                                                    {meal.label}
                                                </label>
                                                <Textarea
                                                    placeholder={`Comentario para el ${meal.label.toLowerCase()}...`}
                                                    className="min-h-[80px] bg-white border-primary/10 focus:ring-primary/20 transition-all resize-none"
                                                    value={(form as any)[meal.id]}
                                                    onChange={(e) => setForm(prev => ({ ...prev, [meal.id]: e.target.value }))}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end gap-3 mt-4">
                                        {isEditing && (
                                            <Button variant="ghost" onClick={handleCancel} className="text-gray-500">
                                                Cancelar
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleSave}
                                            className="bg-primary hover:bg-primary/90 text-white px-8 transition-all hover:scale-105"
                                            disabled={createMutation.isPending || updateMutation.isPending}
                                        >
                                            {isEditing ? (
                                                <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Actualizar</span>
                                            ) : (
                                                <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Agregar</span>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Listado de Comentarios para el paciente */}
                            <Card className="flex-1 flex flex-col border-none shadow-xl bg-white/50 backdrop-blur-sm min-h-[400px]">
                                <CardHeader className="border-b border-primary/5">
                                    <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        Historial de Comentarios
                                    </CardTitle>
                                </CardHeader>
                                <div className="p-4">
                                    <div className="space-y-4">
                                        {commentsQuery.isLoading ? (
                                            <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                                        ) : comments.length === 0 ? (
                                            <div className="text-center py-20 bg-gray-50/50 rounded-2xl border-dashed border-2 border-gray-100 italic text-gray-400">
                                                No hay comentarios registrados para este paciente aún.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {comments.map((comment: any) => (
                                                    <Card key={comment.id} className="border-none shadow-md hover:shadow-lg transition-all bg-white group overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                                        <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
                                                            <div className="flex flex-wrap gap-1">
                                                                {comment.daysOfWeek?.map((day: string) => (
                                                                    <Badge key={day} variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-[10px]">
                                                                        {day}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                                                                    onClick={() => handleEdit(comment)}
                                                                >
                                                                    <Edit2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                                    onClick={() => handleDelete(comment.id)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="p-4 pt-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {MEALS.map(meal => {
                                                                    const content = comment[meal.id]?.[0]?.text;
                                                                    if (!content) return null;
                                                                    return (
                                                                        <div key={meal.id} className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                                                            <span className={cn("text-[9px] font-bold uppercase tracking-tighter block mb-1", meal.color.split(' ')[1])}>
                                                                                {meal.label}
                                                                            </span>
                                                                            <p className="text-sm text-gray-600 italic">
                                                                                "{content}"
                                                                            </p>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div className="mt-3 flex justify-end">
                                                                <span className="text-[10px] text-gray-400 font-medium">Actualizado el {new Date(comment.updatedAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

