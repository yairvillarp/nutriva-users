export interface AnthropometricHistory {
    id: number;
    patientId: number;
    date: string;
    weight?: number;
    height?: number;
    waist_circumference?: number;
    hip_circumference?: number;
    relaxed_arm_circumference?: number;
    contracted_arm_circumference?: number;
    porcentaje_masa_grasa?: number;
    porcentaje_masa_muscular?: number;
    archivos?: string[];
}
