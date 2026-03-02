import { useState, useMemo } from "react";
import { useGetRevenueStats } from "@/hooks/appointments/use-appointments";
import moment from "moment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, Activity } from "lucide-react";

export function Revenue() {
    // Default to current month
    const [startDate, setStartDate] = useState(moment().startOf("month").format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState(moment().endOf("month").format("YYYY-MM-DD"));

    const { data: response, isLoading, isError } = useGetRevenueStats(undefined, startDate, endDate);

    const stats = response?.data || [];

    // Process data to merge grouping: { date, ARS: 100, USD: 50 }
    const chartData = useMemo(() => {
        const dateMap = new Map<string, any>();

        stats.forEach((item: any) => {
            const formattedDate = moment(item.date).format("DD/MM/YYYY");
            if (!dateMap.has(formattedDate)) {
                dateMap.set(formattedDate, { date: formattedDate, ARS: 0, USD: 0 });
            }
            
            const currentObj = dateMap.get(formattedDate);
            if (item.currency === "ARS") {
                currentObj.ARS += Number(item.totalAmount) || 0;
            } else if (item.currency === "USD") {
                currentObj.USD += Number(item.totalAmount) || 0;
            }
        });

        // Convert Map back to array and sort by date explicitly
        return Array.from(dateMap.values()).sort((a, b) => {
            const dateA = moment(a.date, "DD/MM/YYYY").valueOf();
            const dateB = moment(b.date, "DD/MM/YYYY").valueOf();
            return dateA - dateB;
        });
    }, [stats]);

    const totalARS = useMemo(() => chartData.reduce((acc, curr) => acc + curr.ARS, 0), [chartData]);
    const totalUSD = useMemo(() => chartData.reduce((acc, curr) => acc + curr.USD, 0), [chartData]);

    return (
        <div className="p-4 md:p-8 bg-[#F9FAFB] min-h-screen">
            <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-[#344054] tracking-tight">Recaudación</h1>
                    <p className="text-[#667085] text-sm">Visualiza los ingresos generados por tus turnos.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="shadow-sm border-gray-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Recaudado (ARS)</CardTitle>
                        <DollarSign className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">${totalARS.toLocaleString('es-AR')}</div>
                        <p className="text-xs text-gray-500 mt-1">En el periodo seleccionado</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Recaudado (USD)</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">${totalUSD.toLocaleString('en-US')}</div>
                        <p className="text-xs text-gray-500 mt-1">En el periodo seleccionado</p>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-gray-900">Gráfico de Ingresos</h3>
                    </div>
                    
                    <div className="flex flex-1 items-center justify-end gap-4">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-600 font-medium whitespace-nowrap">Desde</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-[140px] h-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-600 font-medium whitespace-nowrap">Hasta</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-[140px] h-9"
                            />
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="w-full h-[400px]">
                    {isLoading ? (
                        <div className="flex w-full h-full items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : isError ? (
                        <div className="flex w-full h-full items-center justify-center text-red-500">
                            Error al cargar la información
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="flex w-full h-full items-center justify-center text-gray-400">
                            No hay datos para el periodo seleccionado
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis 
                                    dataKey="date" 
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis 
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dx={-10}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #F3F4F6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="ARS" name="Recaudación en ARS" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                <Bar dataKey="USD" name="Recaudación en USD" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Revenue;
