import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { patientsService } from "@/services/patients/services";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";
import type { Patient } from "@/types/patients";
import { AnthropometricsManager } from "./AnthropometricsManager";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function AnthropometricsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [currentData, setCurrentData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        if (!id) return;
        try {
            const [patientData, historyData] = await Promise.all([
                patientsService.getPatient(id),
                clinicalHistoryService.getPatientHistory(Number(id))
            ]);

            setPatient(patientData);

            if (historyData) {
                setCurrentData({
                    peso: historyData.peso || 0,
                    estatura: historyData.estatura || 0,
                    perimetro_cadera: historyData.perimetro_cadera || 0,
                    perimetro_cintura: historyData.perimetro_cintura || 0,
                    perimetro_brazo_relajado: historyData.perimetro_brazo_relajado || 0,
                    perimetro_brazo_contraido: historyData.perimetro_brazo_contraido || 0,
                    porcentaje_masa_grasa: historyData.porcentaje_masa_grasa || 0,
                    porcentaje_masa_muscular: historyData.porcentaje_masa_muscular || 0
                });
            } else {
                // Fallback if no history exists yet
                setCurrentData({
                    peso: 0,
                    estatura: 0,
                    perimetro_cadera: 0,
                    perimetro_cintura: 0,
                    perimetro_brazo_relajado: 0,
                    perimetro_brazo_contraido: 0,
                    porcentaje_masa_grasa: 0,
                    porcentaje_masa_muscular: 0
                });
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("No se pudo cargar la información");
            navigate("/mis-pacientes");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, navigate]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                <p className="text-gray-500 font-medium">Cargando...</p>
            </div>
        );
    }

    if (!patient || !currentData) {
        return null;
    }

    return (
        <div className="h-[calc(100vh-120px)] bg-gray-50 flex flex-col -m-6">
            <header className="p-4 border-b bg-white flex items-center gap-4 sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Antropometría</h2>
                    <p className="text-sm text-gray-500">{patient.first_name} {patient.last_name}</p>
                </div>
            </header>
            <div className="flex-1 overflow-hidden">
                <AnthropometricsManager
                    patientId={patient.id}
                    currentData={currentData}
                    onRefresh={fetchData}
                />
            </div>
        </div>
    );
}

export default AnthropometricsPage;
