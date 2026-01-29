export interface AnalyticData {
    id: number;
    patientId: number;
    date: string;
    colesterol_hdl?: number;
    colesterol_ldl?: number;
    colesterol_total?: number;
    trigliceridos?: number;
    presion_arterial?: string;
    glucemia?: number;
    archivos?: string[];
    createdAt?: string;
    updatedAt?: string;
}
