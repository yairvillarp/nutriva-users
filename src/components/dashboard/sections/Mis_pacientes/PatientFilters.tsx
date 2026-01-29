import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PatientFiltersProps {
    filterValue: string;
    onFilterChange: (value: string) => void;
    stats: {
        activeCount: number;
        totalCount: number;
        newThisMonth: number;
    };
}

export function PatientFilters({ filterValue, onFilterChange, stats }: PatientFiltersProps) {
    const activePercentage = stats.totalCount > 0 ? (stats.activeCount / stats.totalCount) * 100 : 0;

    return (
        <div className="space-y-6">
            <Card className="shadow-sm border-none bg-white">
                <CardHeader className="pb-3 px-6 pt-6">
                    <CardTitle className="text-lg font-bold text-gray-700">Filtrar pacientes</CardTitle>
                    <p className="text-sm text-gray-400 font-normal">Filtra los pacientes a presentar</p>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <Select
                        value={filterValue}
                        onChange={(e) => onFilterChange(e.target.value)}
                        className="w-full bg-gray-50 border-gray-100"
                    >
                        <option value="all">Todos los pacientes</option>
                        <option value="Influencer">Influencer</option>
                        <option value="Premium">Premium</option>
                        <option value="Administrador">Administrador</option>
                        <option value="Usuario sin subscription">Usuario sin subscription</option>
                        <option value="Suscripción Cancelada">Suscripción Cancelada</option>
                    </Select>

                    <div className="mt-8 space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-xl font-bold text-gray-700">{stats.activeCount} de {stats.totalCount}</span>
                                <span className="text-gray-400 text-sm font-medium">{Math.round(activePercentage)}%</span>
                            </div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Pacientes activos sobre el total de pacientes</p>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-700 ease-out"
                                    style={{ width: `${activePercentage}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="text-3xl font-bold text-gray-700">{stats.newThisMonth}</div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold flex items-center mt-1">
                                Nuevos pacientes este mes <span className="text-emerald-500 ml-2 font-bold select-none">↗ 200%</span>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-white">
                <CardHeader className="px-6 pt-6">
                    <CardTitle className="text-lg font-bold text-gray-700">Nuevos pacientes</CardTitle>
                    <p className="text-sm text-gray-400 font-normal">Evolución de nuevos pacientes en las últimas 6 semanas</p>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-4">
                    <div className="h-32 flex items-end justify-between space-x-2">
                        {[15, 25, 10, 35, 20, 85].map((height, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-primary/10 hover:bg-primary/30 transition-all rounded-t-sm group relative cursor-help"
                                style={{ height: `${height}%` }}
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Semana {i + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-bold uppercase">
                        <span>25 nov.</span>
                        <span>06 ene.</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
