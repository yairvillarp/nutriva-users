import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { patientsService } from "@/services/patients/services";
import type { Patient } from "@/types/patients";
import { ClinicalHistoryForm } from "./ClinicalHistoryForm";
import { toast } from "sonner";

export function ClinicalHistoryPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPatient = async () => {
            if (!id) return;
            try {
                const data = await patientsService.getPatient(id);
                setPatient(data);
            } catch (error) {
                console.error("Error fetching patient:", error);
                toast.error("No se pudo cargar la información del paciente");
                navigate("/mis-pacientes");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatient();
    }, [id, navigate]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                <p className="text-gray-500 font-medium">Cargando información del paciente...</p>
            </div>
        );
    }

    if (!patient) {
        return null;
    }

    return (
        <div className="h-[calc(100vh-120px)] bg-gray-50 flex flex-col -m-6">
            <div className="flex-1 overflow-hidden">
                <ClinicalHistoryForm
                    patient={patient}
                    onClose={() => navigate("/mis-pacientes")}
                />
            </div>
        </div>
    );
}

export default ClinicalHistoryPage;
