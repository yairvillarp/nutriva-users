import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AnalyticDataManager } from "./AnalyticDataManager";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";
import { toast } from "sonner";

interface CurrentData {
    colesterol_hdl?: number;
    colesterol_ldl?: number;
    colesterol_total?: number;
    trigliceridos?: number;
    presion_arterial?: string;
    glucemia?: number;
}

export default function AnalyticDataPage() {
    const { id } = useParams();
    const [currentData, setCurrentData] = useState<CurrentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            const data = await clinicalHistoryService.getPatientHistory(Number(id));
            if (data) {
                setCurrentData({
                    colesterol_hdl: data.colesterol_hdl,
                    colesterol_ldl: data.colesterol_ldl,
                    colesterol_total: data.colesterol_total,
                    trigliceridos: data.trigliceridos,
                    presion_arterial: data.presion_arterial,
                    glucemia: data.glucemia,
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar datos clínicos.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [id, fetchData]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!id) return <div>No se encontró el paciente</div>;

    return (
        <AnalyticDataManager
            patientId={Number(id)}
            currentData={currentData || {}}
            onRefresh={fetchData}
        />
    );
}
