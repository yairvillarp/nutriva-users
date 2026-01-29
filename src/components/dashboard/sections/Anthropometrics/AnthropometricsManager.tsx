import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Trash2, Activity, Ruler, Weight, ArrowLeft, Pencil, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { anthropometricService } from "@/services/anthropometricService";
import { filesService } from "@/services/files/services";
import type { AnthropometricHistory } from "@/types/anthropometric";
import moment from "moment";

interface AnthropometricsManagerProps {
    patientId: number;
    currentData: {
        peso: number;
        estatura: number;
        perimetro_cadera: number;
        perimetro_cintura: number;
        perimetro_brazo_relajado: number;
        perimetro_brazo_contraido: number;
        porcentaje_masa_grasa?: number;
        porcentaje_masa_muscular?: number;
        archivos?: string[];
    };
    onRefresh: () => void;
}

interface AnthroChartDataItem {
    date: string;
    weight?: number;
    height?: number;
    waist_circumference?: number;
    hip_circumference?: number;
    relaxed_arm_circumference?: number;
    contracted_arm_circumference?: number;
    porcentaje_masa_grasa?: number;
    porcentaje_masa_muscular?: number;
}

export function AnthropometricsManager({ patientId, currentData, onRefresh }: AnthropometricsManagerProps) {
    const navigate = useNavigate();
    const [history, setHistory] = useState<AnthropometricHistory[]>([]);
    const [chartData, setChartData] = useState<AnthroChartDataItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Date filter state (Defaults: 1st of month to Today in local time)
    const [startDate, setStartDate] = useState(moment().startOf("month").format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState(moment().add(1, "days").format("YYYY-MM-DD"));

    const { register, handleSubmit, reset, watch, setValue } = useForm<Omit<AnthropometricHistory, "id" | "patientId">>({
        defaultValues: {
            date: moment().format("YYYY-MM-DD"),
            weight: undefined,
            height: undefined,
            waist_circumference: undefined,
            hip_circumference: undefined,
            relaxed_arm_circumference: undefined,
            contracted_arm_circumference: undefined,
            porcentaje_masa_grasa: undefined,
            porcentaje_masa_muscular: undefined,
            archivos: []
        }
    });

    // Helper to map current data to form values
    useEffect(() => {
        if (currentData) {
            reset({
                date: moment().format("YYYY-MM-DD"),
                weight: currentData.peso || undefined,
                height: currentData.estatura || undefined,
                waist_circumference: currentData.perimetro_cintura || undefined,
                hip_circumference: currentData.perimetro_cadera || undefined,
                relaxed_arm_circumference: currentData.perimetro_brazo_relajado || undefined,
                contracted_arm_circumference: currentData.perimetro_brazo_contraido || undefined,
                porcentaje_masa_grasa: currentData.porcentaje_masa_grasa || undefined,
                porcentaje_masa_muscular: currentData.porcentaje_masa_muscular || undefined,
                archivos: currentData.archivos || []
            });
        }
    }, [currentData, reset]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [historyRes, chartRes] = await Promise.all([
                anthropometricService.getAll(patientId, page, 5, startDate, endDate),
                anthropometricService.getAllForCharts(patientId, startDate, endDate)
            ]);
            setHistory(historyRes.data);
            setTotalPages(historyRes.totalPages);

            // Format chart data
            const formattedCharts = chartRes.map((item: AnthropometricHistory) => ({
                ...item,
                date: moment.utc(item.date).format("DD/MM/YYYY")
            }));
            setChartData(formattedCharts);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar datos antropométricos");
        } finally {
            setIsLoading(false);
        }
    }, [patientId, page, startDate, endDate]);

    useEffect(() => {
        if (patientId) {
            loadData();
        }
    }, [patientId, loadData]);

    const handleEdit = (item: AnthropometricHistory) => {
        reset({
            date: moment.utc(item.date).format("YYYY-MM-DD"),
            weight: item.weight,
            height: item.height,
            waist_circumference: item.waist_circumference,
            hip_circumference: item.hip_circumference,
            relaxed_arm_circumference: item.relaxed_arm_circumference,
            contracted_arm_circumference: item.contracted_arm_circumference,
            porcentaje_masa_grasa: item.porcentaje_masa_grasa,
            porcentaje_masa_muscular: item.porcentaje_masa_muscular,
            archivos: item.archivos || []
        });
        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onSubmit = async (data: Omit<AnthropometricHistory, "id" | "patientId">) => {
        try {
            await anthropometricService.create({
                ...data,
                patientId,
                // Ensure numbers
                weight: data.weight ? Number(data.weight) : undefined,
                height: data.height ? Number(data.height) : undefined,
                waist_circumference: data.waist_circumference ? Number(data.waist_circumference) : undefined,
                hip_circumference: data.hip_circumference ? Number(data.hip_circumference) : undefined,
                relaxed_arm_circumference: data.relaxed_arm_circumference ? Number(data.relaxed_arm_circumference) : undefined,
                contracted_arm_circumference: data.contracted_arm_circumference ? Number(data.contracted_arm_circumference) : undefined,
                porcentaje_masa_grasa: data.porcentaje_masa_grasa ? Number(data.porcentaje_masa_grasa) : undefined,
                porcentaje_masa_muscular: data.porcentaje_masa_muscular ? Number(data.porcentaje_masa_muscular) : undefined,
            });
            toast.success("Registro guardado");

            // Refresh local list and parent data (sidebar)
            loadData();
            onRefresh();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar registro");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Está seguro de eliminar este registro?")) return;
        try {
            await anthropometricService.delete(id);
            toast.success("Registro eliminado");
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar registro");
        }
    };

    const MetricsDisplay = ({ label, value, unit, icon: Icon }: { label: string; value: string | number | undefined; unit: string; icon: React.ElementType }) => (
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium">{label}</p>
                    <p className="text-lg font-bold text-gray-900">
                        {value ? value : "-"} <span className="text-xs font-normal text-gray-400">{unit}</span>
                    </p>
                </div>
            </div>
        </div>
    );

    const metricsCharts = [
        { key: "weight", label: "Peso", color: "#3b82f6" },
        { key: "hip_circumference", label: "Perímetro Cadera", color: "#10b981" },
        { key: "waist_circumference", label: "Perímetro Cintura", color: "#f59e0b" },
        { key: "relaxed_arm_circumference", label: "Brazo Relajado", color: "#8b5cf6" },
        { key: "contracted_arm_circumference", label: "Brazo Contraído", color: "#ec4899" },
        { key: "porcentaje_masa_grasa", label: "Masa Grasa (%)", color: "#f43f5e" },
        { key: "porcentaje_masa_muscular", label: "Masa Muscular (%)", color: "#10b981" },
    ];

    const formatDate = (date: string | Date) => {
        return moment.utc(date).format("DD/MM/YYYY");
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <header className="p-4 border-b bg-white flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/mis-pacientes/${patientId}/historia-clinica`)}
                        className="text-gray-500 hover:text-primary"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Ir a Historia clínica
                    </Button>
                    <div className="h-6 w-[1px] bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <Activity className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-bold text-gray-900">Datos Antropométricos</h2>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT SIDEBAR - CURRENT METRICS */}
                <div className="w-80 bg-white border-r p-6 overflow-y-auto shrink-0 hidden md:block">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Datos Actuales
                    </h3>
                    <div className="space-y-4">
                        <MetricsDisplay label="Peso" value={currentData.peso} unit="kg" icon={Weight} />
                        <MetricsDisplay label="Estatura" value={currentData.estatura} unit="cm" icon={Ruler} />
                        <MetricsDisplay label="Cintura" value={currentData.perimetro_cintura} unit="cm" icon={Ruler} />
                        <MetricsDisplay label="Cadera" value={currentData.perimetro_cadera} unit="cm" icon={Ruler} />
                        <MetricsDisplay label="Brazo Relajado" value={currentData.perimetro_brazo_relajado} unit="cm" icon={Ruler} />
                        <MetricsDisplay label="Brazo Contraído" value={currentData.perimetro_brazo_contraido} unit="cm" icon={Ruler} />
                        <MetricsDisplay label="Masa Grasa" value={currentData.porcentaje_masa_grasa} unit="%" icon={Activity} />
                        <MetricsDisplay label="Masa Muscular" value={currentData.porcentaje_masa_muscular} unit="%" icon={Activity} />
                    </div>
                    <div className="mt-8 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100">
                        Estos datos provienen de la Historia Clínica actual. Para actualizar el historial, utilice el formulario de la derecha.
                    </div>
                </div>

                {/* RIGHT CONTENT - FORM, LIST, CHARTS */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    )}

                    {/* FORM SECTION */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Nuevo Registro</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Fecha</Label>
                                        <Input type="date" {...register("date", { required: true })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Peso (kg)</Label>
                                        <Input type="number" step="0.1" {...register("weight")} placeholder="Ej: 70.5" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Altura (cm)</Label>
                                        <Input type="number" {...register("height")} placeholder="Ej: 175" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Cintura (cm)</Label>
                                        <Input type="number" step="0.1" {...register("waist_circumference")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cadera (cm)</Label>
                                        <Input type="number" step="0.1" {...register("hip_circumference")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Brazo Relajado (cm)</Label>
                                        <Input type="number" step="0.1" {...register("relaxed_arm_circumference")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Brazo Contraído (cm)</Label>
                                        <Input type="number" step="0.1" {...register("contracted_arm_circumference")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Masa Grasa (%)</Label>
                                        <Input type="number" step="0.1" {...register("porcentaje_masa_grasa")} placeholder="Ej: 15.5" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Masa Muscular (%)</Label>
                                        <Input type="number" step="0.1" {...register("porcentaje_masa_muscular")} placeholder="Ej: 40.2" />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button type="submit">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar Registro
                                    </Button>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <Label className="text-sm font-bold">Archivos adjuntos</Label>

                                    {/* File Upload Area */}
                                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
                                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-600 mb-1">
                                            Haga clic para subir archivos
                                        </p>
                                        <p className="text-xs text-gray-400 mb-4">
                                            (PDF, Imágenes, Texto)
                                        </p>
                                        <Input
                                            type="file"
                                            className="max-w-xs"
                                            accept=".pdf,.txt,image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                const toastId = toast.loading("Subiendo archivo...");
                                                try {
                                                    const response = await filesService.uploadImage(file);
                                                    if (response && response.length > 0 && response[0].Location) {
                                                        const currentFiles = watch("archivos") || [];
                                                        const newFiles = [...currentFiles, response[0].Location];
                                                        setValue("archivos", newFiles);
                                                    }
                                                    toast.success("Archivo subido correctamente", { id: toastId });
                                                } catch (error) {
                                                    console.error(error);
                                                    toast.error("Error al subir el archivo", { id: toastId });
                                                }
                                                e.target.value = "";
                                            }}
                                        />
                                    </div>

                                    {/* Files List */}
                                    <div className="space-y-2">
                                        {(watch("archivos") || []).length > 0 ? (
                                            (watch("archivos") || []).map((url, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:underline truncate"
                                                            title={url}
                                                        >
                                                            {url.split('/').pop() || "Archivo adjunto"}
                                                        </a>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-400 hover:text-red-500"
                                                        onClick={() => {
                                                            const newFiles = (watch("archivos") || []).filter((_, i) => i !== index);
                                                            setValue("archivos", newFiles);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 text-center italic">
                                                No hay archivos adjuntos
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* FILTER SECTION */}
                    <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
                        <span className="text-sm font-medium text-gray-700">Filtrar por periodo:</span>
                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-500">Desde</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-auto"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-500">Hasta</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-auto"
                            />
                        </div>
                    </div>

                    {/* LIST SECTION */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Historial</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Peso</TableHead>
                                            <TableHead>Altura</TableHead>
                                            <TableHead>Cintura</TableHead>
                                            <TableHead>Cadera</TableHead>
                                            <TableHead>Brazo (R)</TableHead>
                                            <TableHead>Brazo (C)</TableHead>
                                            <TableHead>Masa Grasa (%)</TableHead>
                                            <TableHead>Masa Muscular (%)</TableHead>
                                            <TableHead>Archivos</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.length > 0 ? (
                                            history.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{formatDate(item.date)}</TableCell>
                                                    <TableCell>{item.weight || "-"}</TableCell>
                                                    <TableCell>{item.height || "-"}</TableCell>
                                                    <TableCell>{item.waist_circumference || "-"}</TableCell>
                                                    <TableCell>{item.hip_circumference || "-"}</TableCell>
                                                    <TableCell>{item.relaxed_arm_circumference || "-"}</TableCell>
                                                    <TableCell>{item.contracted_arm_circumference || "-"}</TableCell>
                                                    <TableCell>{item.porcentaje_masa_grasa ? `${item.porcentaje_masa_grasa}%` : "-"}</TableCell>
                                                    <TableCell>{item.porcentaje_masa_muscular ? `${item.porcentaje_masa_muscular}%` : "-"}</TableCell>
                                                    <TableCell>
                                                        {item.archivos && item.archivos.length > 0 ? (
                                                            <div className="flex gap-1">
                                                                {item.archivos.map((url, idx) => (
                                                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" title="Ver archivo">
                                                                        <FileText className="h-4 w-4 text-primary hover:text-primary/80" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        ) : "-"}
                                                    </TableCell>
                                                    <TableCell className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                            <Pencil className="h-4 w-4 text-primary" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-6 text-gray-500">
                                                    No hay registros disponibles
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex items-center justify-end space-x-2 py-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Anterior
                                </Button>
                                <div className="text-sm text-gray-500">
                                    Página {page} de {totalPages || 1}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CHARTS SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                        {metricsCharts.map((metric) => (
                            <Card key={metric.key} className="col-span-1">
                                <CardHeader>
                                    <CardTitle className="text-md font-medium text-gray-700">{metric.label}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 12 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 12 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    domain={['auto', 'auto']}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Bar
                                                    dataKey={metric.key}
                                                    fill={metric.color}
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={50}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
