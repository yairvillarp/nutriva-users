import { usePatients } from "@/hooks/patients/use-patients";
import { useNavigate } from "react-router-dom";
import { PatientList } from "./PatientList";

export function Usuarios() {
    const {
        patients,
        pagination,
        isLoading,
        search,
        setSearch,
        setPage
    } = usePatients(10);
    const navigate = useNavigate();

    return (
        <div className="p-4 md:p-8 bg-[#F9FAFB] min-h-screen">
            <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-[#344054] tracking-tight">Usuarios</h1>
                    <p className="text-[#667085] text-sm">Consulta informaciones de los usuarios del sistema.</p>
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

            <div className="w-full">
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-[#344054]">Listado de usuarios</h2>
                    <p className="text-xs text-[#667085]">Consulta información sobre los usuarios</p>
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
                    />
                )}
            </div>

            {/* Float bubble as in mock */}
            <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50">
                <button className="bg-[#0BB298] text-white p-4 rounded-2xl shadow-xl hover:scale-105 transition-transform">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default Usuarios;
