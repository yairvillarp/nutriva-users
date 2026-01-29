import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Trash2, Activity, HeartPulse, Droplet, ArrowLeft, Pencil, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { analyticDataService } from "@/services/analyticDataService";
import { filesService } from "@/services/files/services";
import type { AnalyticData } from "@/types/analyticData";
import moment from "moment";

interface AnalyticDataManagerProps {
    patientId: number;
    currentData: {
        colesterol_hdl?: number;
        colesterol_ldl?: number;
        colesterol_total?: number;
        trigliceridos?: number;
        presion_arterial?: string;
        glucemia?: number;
        archivos?: string[];
    };
    onRefresh: () => void;
}

interface ChartDataItem {
    date: string;
    colesterol_hdl?: number;
    colesterol_ldl?: number;
    colesterol_total?: number;
    trigliceridos?: number;
    glucemia?: number;
}

export function AnalyticDataManager({ patientId, currentData, onRefresh }: AnalyticDataManagerProps) {
    const navigate = useNavigate();
    const [history, setHistory] = useState<AnalyticData[]>([]);
    const [chartData, setChartData] = useState<ChartDataItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Date filter state (Defaults: 1st of month to Today in local time)
    const [startDate, setStartDate] = useState(moment().startOf("month").format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState(moment().add(1, "days").format("YYYY-MM-DD"));

    const { register, handleSubmit, reset, watch, setValue } = useForm<Omit<AnalyticData, "id" | "patientId">>({
        defaultValues: {
            date: moment().format("YYYY-MM-DD"),
            colesterol_hdl: undefined,
            colesterol_ldl: undefined,
            colesterol_total: undefined,
            trigliceridos: undefined,
            presion_arterial: "",
            glucemia: undefined,
            archivos: []
        }
    });

    // Helper to map current data to form values
    useEffect(() => {
        if (currentData) {
            reset({
                date: moment().format("YYYY-MM-DD"),
                colesterol_hdl: currentData.colesterol_hdl || undefined,
                colesterol_ldl: currentData.colesterol_ldl || undefined,
                colesterol_total: currentData.colesterol_total || undefined,
                trigliceridos: currentData.trigliceridos || undefined,
                presion_arterial: currentData.presion_arterial || "",
                glucemia: currentData.glucemia || undefined,
                archivos: currentData.archivos || []
            });
        }
    }, [currentData, reset]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [historyRes, chartRes] = await Promise.all([
                analyticDataService.getAll(patientId, page, 5, startDate, endDate),
                analyticDataService.getAllForCharts(patientId, startDate, endDate)
            ]);
            setHistory(historyRes.data);
            setTotalPages(historyRes.totalPages);

            // Format chart data
            const formattedCharts = chartRes.map((item: AnalyticData) => ({
                ...item,
                date: moment.utc(item.date).format("DD/MM/YYYY")
            }));
            setChartData(formattedCharts);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar datos analíticos");
        } finally {
            setIsLoading(false);
        }
    }, [patientId, page, startDate, endDate]);

    useEffect(() => {
        if (patientId) {
            loadData();
        }
    }, [patientId, loadData]);

    const handleEdit = (item: AnalyticData) => {
        reset({
            date: moment.utc(item.date).format("YYYY-MM-DD"),
            colesterol_hdl: item.colesterol_hdl,
            colesterol_ldl: item.colesterol_ldl,
            colesterol_total: item.colesterol_total,
            trigliceridos: item.trigliceridos,
            presion_arterial: item.presion_arterial,
            glucemia: item.glucemia,
            archivos: item.archivos || []
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onSubmit = async (data: Omit<AnalyticData, "id" | "patientId">) => {
        try {
            await analyticDataService.create({
                ...data,
                patientId,
                // Ensure numbers
                colesterol_hdl: data.colesterol_hdl ? Number(data.colesterol_hdl) : undefined,
                colesterol_ldl: data.colesterol_ldl ? Number(data.colesterol_ldl) : undefined,
                colesterol_total: data.colesterol_total ? Number(data.colesterol_total) : undefined,
                trigliceridos: data.trigliceridos ? Number(data.trigliceridos) : undefined,
                glucemia: data.glucemia ? Number(data.glucemia) : undefined,
                // String logic for pressure remains as string
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
            await analyticDataService.delete(id);
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
        { key: "colesterol_total", label: "Colesterol Total", color: "#ef4444" },
        { key: "colesterol_hdl", label: "Colesterol HDL", color: "#3b82f6" },
        { key: "colesterol_ldl", label: "Colesterol LDL", color: "#f59e0b" },
        { key: "trigliceridos", label: "Triglicéridos", color: "#10b981" },
        { key: "glucemia", label: "Glucemia", color: "#8b5cf6" },
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
                        <h2 className="text-xl font-bold text-gray-900">Datos Analíticos</h2>
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
                        <MetricsDisplay label="Col. HDL" value={currentData.colesterol_hdl} unit="mg/dL" icon={Droplet} />
                        <MetricsDisplay label="Col. LDL" value={currentData.colesterol_ldl} unit="mg/dL" icon={Droplet} />
                        <MetricsDisplay label="Col. Total" value={currentData.colesterol_total} unit="mg/dL" icon={Droplet} />
                        <MetricsDisplay label="Triglicéridos" value={currentData.trigliceridos} unit="mg/dL" icon={Droplet} />
                        <MetricsDisplay label="Presión Arterial" value={currentData.presion_arterial} unit="mmHg" icon={HeartPulse} />
                        <MetricsDisplay label="Glucemia" value={currentData.glucemia} unit="mg/dL" icon={Droplet} />
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
                                        <Label>Presión Art.</Label>
                                        <Input {...register("presion_arterial")} placeholder="Ej: 120/80" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Glucemia</Label>
                                        <Input type="number" step="0.1" {...register("glucemia")} placeholder="mg/dL" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Col. HDL</Label>
                                        <Input type="number" step="0.1" {...register("colesterol_hdl")} placeholder="mg/dL" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Col. LDL</Label>
                                        <Input type="number" step="0.1" {...register("colesterol_ldl")} placeholder="mg/dL" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Col. Total</Label>
                                        <Input type="number" step="0.1" {...register("colesterol_total")} placeholder="mg/dL" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Triglicéridos</Label>
                                        <Input type="number" step="0.1" {...register("trigliceridos")} placeholder="mg/dL" />
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
                                            <TableHead>P. Arterial</TableHead>
                                            <TableHead>Glucemia</TableHead>
                                            <TableHead>HDL</TableHead>
                                            <TableHead>LDL</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Triglicéridos</TableHead>
                                            <TableHead>Archivos</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.length > 0 ? (
                                            history.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{formatDate(item.date)}</TableCell>
                                                    <TableCell>{item.presion_arterial || "-"}</TableCell>
                                                    <TableCell>{item.glucemia || "-"}</TableCell>
                                                    <TableCell>{item.colesterol_hdl || "-"}</TableCell>
                                                    <TableCell>{item.colesterol_ldl || "-"}</TableCell>
                                                    <TableCell>{item.colesterol_total || "-"}</TableCell>
                                                    <TableCell>{item.trigliceridos || "-"}</TableCell>
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
