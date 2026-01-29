export interface CustomQuestion {
    question: string;
    answer: string;
}

export interface ClinicalHistory {
    id?: number;
    patientId: number;
    createdAt?: string;
    updatedAt?: string;

    // Preguntas Generales relacionadas a la consulta
    motivo_consulta: string;
    expectativas: string;
    experiencias_pasadas_nutricionistas: string;

    // Preguntas Generales personales
    pais_residencia: string;
    objetivo: string;
    peso_objetivo: string;
    velocidad: 'rapido' | 'recomendado' | 'lento';
    sexo: 'hombre' | 'mujer';
    fecha_nacimiento: string;
    estatura: number;
    peso: number;
    realiza_actividad_fisica: boolean;
    actividad_fisica_realiza?: string;
    frecuencia_duracion_actividad?: string;
    entrenamientos_fuerza: boolean;
    nivel_actividad_fisica: 'baja' | 'media' | 'alta' | 'atleta';
    preguntas_adicionales_personales: CustomQuestion[];

    // Preguntas generales - Historia personal y social
    funcion_intestinal: string[];
    calidad_sueno: string;
    horas_sueno_promedio: number;
    nivel_estres: number;
    estres_asociado_especial?: string;
    fumador: boolean;
    bebe_alcohol: {
        value: boolean;
        amount?: string;
    };
    estado_civil: string;
    informacion_adicional_relevante?: string;
    preguntas_adicionales_social: CustomQuestion[];

    // Preguntas generales - Historia clínica
    patologias_actuales: string;
    antecedentes_personales: string[];
    antecedentes_familiares: string[];
    medicacion: string;
    historial_embarazo: string;
    preguntas_adicionales_clinica: CustomQuestion[];

    // Antropometría
    perimetro_cadera?: number;
    perimetro_cintura?: number;
    perimetro_brazo_relajado?: number;
    perimetro_brazo_contraido?: number;
    porcentaje_masa_grasa?: number;
    porcentaje_masa_muscular?: number;

    // Datos Analíticos
    colesterol_hdl?: number;
    colesterol_ldl?: number;
    colesterol_total?: number;
    trigliceridos?: number;
    presion_arterial?: string;
    glucemia?: number;

    // Preguntas específicas - Nutricionales y de alimentación
    hora_acostarse: string;
    hora_levantarse: string;
    ayuno_intermitente: {
        value: boolean;
        hours?: number;
    };
    vegano: boolean;
    celiaquia_intolerancia_gluten: boolean;
    otro_tipo_dieta?: string;
    alimentos_consumidos: {
        proteinas: boolean;
        carbohidratos: boolean;
        grasas: boolean;
        lacteos: boolean;
        frutas: boolean;
    };
    alergias_intolerancias?: string;
    ingesta_agua_promedio: string;
    deficiencia_nutricional?: string;
    preguntas_adicionales_nutricionales: CustomQuestion[];

    // Preguntas específicas - con respecto al plan y el menú
    visualizacion_porciones: 'medidas_caseras' | 'gramos';

    // Observaciones y Archivos
    observaciones_extra?: string;
    archivos: string[]; // URLs of uploaded files

    // Temporary form fields
    _temp_personal_other?: string;
    _temp_family_other?: string;
    _temp_goal_other?: string;
    visualizacion_calorias: 'visibles' | 'no_visibles';
}
