import { useMemo } from "react";
import { useMyPatients } from "@/hooks/patients/use-my-patients";
import { useNavigate } from "react-router-dom";
import { PatientList } from "./PatientList";
import { PatientFilters } from "./PatientFilters";

export function MisPacientes() {
    const {
        patients,
        pagination,
        isLoading,
        search,
        setSearch,
        setPage,
        filters,
        setFilters
    } = useMyPatients(10);
    const navigate = useNavigate();

    const handleFilterChange = (value: string) => {
        if (value === "all") {
            const newFilters = { ...filters };
            // Remove all filter_ keys
            Object.keys(newFilters).forEach(key => {
                if (key.startsWith('filter_')) delete newFilters[key];
            });
            setFilters(newFilters);
        } else {
            setFilters({ filter_type: value });
        }
        setPage(1);
    };

    const currentFilter = useMemo(() => {
        const filterKey = Object.keys(filters).find(k => k.startsWith('filter_'));
        return filterKey ? filters[filterKey] : "all";
    }, [filters]);

    return (
        <div className="p-4 md:p-8 bg-[#F9FAFB] min-h-screen">
            <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-[#344054] tracking-tight">Mis Pacientes</h1>
                    <p className="text-[#667085] text-sm">Consulta informaciones de tus pacientes asociados.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-[#344054]">
                        Actualmente en <span className="font-bold text-[#101828]">Consultorio en línea</span>
                    </p>
                    <p className="text-xs text-[#667085] mt-0.5">
                        {new Intl.DateTimeFormat('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }).format(new Date())}
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-[#344054]">Mis Pacientes</h2>
                        <p className="text-xs text-[#667085]">Consulta información sobre tus pacientes</p>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-50">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
                            <p className="text-gray-400 text-sm font-medium">Cargando pacientes...</p>
                        </div>
                    ) : (
                        <PatientList
                            patients={patients}
                            pagination={pagination}
                            search={search}
                            onSearchChange={setSearch}
                            onPatientClick={(patient) => navigate(`/mis-pacientes/${patient.id}/historia-clinica`)}
                            onPageChange={(p) => {
                                setPage(p);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                        />
                    )}
                </div>

                <div className="xl:col-span-4 sticky top-8">
                    <PatientFilters
                        filterValue={currentFilter}
                        onFilterChange={handleFilterChange}
                        stats={{
                            activeCount: pagination?.total_items ? Math.floor(pagination.total_items * 0.5) : 0,
                            totalCount: pagination?.total_items || 0,
                            newThisMonth: 1
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default MisPacientes;
