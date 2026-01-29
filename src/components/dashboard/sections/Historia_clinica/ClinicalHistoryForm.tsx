import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import type { Control, UseFormRegister, UseFormWatch } from "react-hook-form";
import type { ClinicalHistory } from "@/types/clinicalHistory";
import type { Patient } from "@/types/patients";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Plus, Trash2, X, Activity, User, Heart, Utensils, Settings, Paperclip, Upload, FileText } from "lucide-react";
import { filesService } from "@/services/files/services";
import { toast } from "sonner";

interface ClinicalHistoryFormProps {
    patient: Patient;
    onClose: () => void;
    onSave?: (history: ClinicalHistory) => void;
}


export function ClinicalHistoryForm({ patient, onClose, onSave }: ClinicalHistoryFormProps) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<string>("consultation");
    // Removed isAnthropometricsOpen state
    // Determine if editing based on if we loaded history (we can check if defaultValues are populated or simply trust the load process)
    // A simple reliable way is checking if we have a history ID, but we didn't store it in form state explicitly yet.
    // However, if we are in this form, and we fetch data, we can consider it "editing" if data returns. 
    // Let's add a state for `hasHistory`.
    const [hasHistory, setHasHistory] = useState(false);

    const defaultValues: Partial<ClinicalHistory> = {
        patientId: patient.id,
        motivo_consulta: "",
        expectativas: "",
        experiencias_pasadas_nutricionistas: "",
        pais_residencia: "",
        objetivo: "mantener_peso",
        peso_objetivo: "",
        velocidad: "recomendado",
        sexo: patient.sex as any || "hombre",
        fecha_nacimiento: "",
        estatura: patient.height || 0,
        peso: patient.weight || 0,
        realiza_actividad_fisica: false,
        actividad_fisica_realiza: "",
        frecuencia_duracion_actividad: "",
        entrenamientos_fuerza: false,
        nivel_actividad_fisica: "media",
        preguntas_adicionales_personales: [],
        funcion_intestinal: [],
        calidad_sueno: "",
        horas_sueno_promedio: 8,
        nivel_estres: 5,
        estres_asociado_especial: "",
        fumador: false,
        bebe_alcohol: { value: false },
        estado_civil: "",
        informacion_adicional_relevante: "",
        preguntas_adicionales_social: [],
        patologias_actuales: "",
        antecedentes_personales: [],
        antecedentes_familiares: [],
        medicacion: "",
        historial_embarazo: "",
        preguntas_adicionales_clinica: [],
        hora_acostarse: "",
        hora_levantarse: "",
        ayuno_intermitente: { value: false, hours: 0 },
        vegano: patient.is_vegetarian || false,
        celiaquia_intolerancia_gluten: false,
        otro_tipo_dieta: "",
        alimentos_consumidos: {
            proteinas: true,
            carbohidratos: true,
            grasas: true,
            lacteos: true,
            frutas: true
        },
        alergias_intolerancias: "",
        ingesta_agua_promedio: "",
        deficiencia_nutricional: "",
        preguntas_adicionales_nutricionales: [],
        visualizacion_porciones: "medidas_caseras",
        visualizacion_calorias: "visibles",
        observaciones_extra: "",
        archivos: []
    };

    const { register, control, handleSubmit, reset, watch, setValue } = useForm<ClinicalHistory>({
        defaultValues
    });

    const standardBackgroundOptions = [
        'Diabetes tipo 1',
        'Diabetes tipo 2',
        'Hipertensión arterial',
        'Enfermedad cardiovascular',
        'Dislipemias',
        'Celiaquía',
        'Problemas renales',
        'Ninguna'
    ];

    const [countries, setCountries] = useState<string[]>([]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [history, countryList] = await Promise.all([
                    clinicalHistoryService.getPatientHistory(patient.id),
                    clinicalHistoryService.getCountries()
                ]);

                if (countryList) setCountries(countryList);

                if (history) {
                    setHasHistory(true);
                    // Extract custom values for background groups
                    const personalOther = history.antecedentes_personales?.find(v => !standardBackgroundOptions.includes(v));
                    const familyOther = history.antecedentes_familiares?.find(v => !standardBackgroundOptions.includes(v));

                    const prepareData = {
                        ...history,
                        antecedentes_personales: history.antecedentes_personales?.map(v => standardBackgroundOptions.includes(v) ? v : 'Otra') || [],
                        antecedentes_familiares: history.antecedentes_familiares?.map(v => standardBackgroundOptions.includes(v) ? v : 'Otra') || [],
                        _temp_personal_other: personalOther || "",
                        _temp_family_other: familyOther || "",

                        _temp_goal_other: (history.objetivo && !['perder_grasa', 'mantener_peso', 'ganar_musculo'].includes(history.objetivo)) ? history.objetivo : ""
                    };

                    if (prepareData._temp_goal_other) {
                        prepareData.objetivo = "otro";
                    }

                    reset(prepareData as any);
                }
            } catch (error) {
                console.error("Error loading initial data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [patient.id, reset]);

    const onSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            // Merge "Other" values into arrays
            const finalData = { ...data };

            if (data.antecedentes_personales?.includes('Otra')) {
                finalData.antecedentes_personales = data.antecedentes_personales
                    .filter((v: string) => v !== 'Otra')
                    .concat(data._temp_personal_other);
            } else {
                finalData.antecedentes_personales = data.antecedentes_personales?.filter((v: string) => v !== 'Otra');
            }

            if (data.antecedentes_familiares?.includes('Otra')) {
                finalData.antecedentes_familiares = data.antecedentes_familiares
                    .filter((v: string) => v !== 'Otra')
                    .concat(data._temp_family_other);
            } else {
                finalData.antecedentes_familiares = data.antecedentes_familiares?.filter((v: string) => v !== 'Otra');
            }

            // Handle empty date
            if (!finalData.fecha_nacimiento || finalData.fecha_nacimiento === "Invalid date") {
                finalData.fecha_nacimiento = null;
            }

            // Cleanup numeric fields (avoid NaN)
            if (isNaN(finalData.estatura)) finalData.estatura = null;
            if (isNaN(finalData.peso)) finalData.peso = null;
            if (isNaN(finalData.horas_sueno_promedio)) finalData.horas_sueno_promedio = null;
            if (isNaN(finalData.nivel_estres)) finalData.nivel_estres = null;

            if (data.objetivo === "otro") {
                finalData.objetivo = data._temp_goal_other;
            }

            // Cleanup temp fields
            delete finalData._temp_personal_other;
            delete finalData._temp_family_other;
            delete finalData._temp_goal_other;

            // Ensure patientId is set
            finalData.patientId = patient.id;

            const saved = await clinicalHistoryService.savePatientHistory(finalData as ClinicalHistory);
            toast.success("Historia clínica guardada correctamente");
            if (onSave) onSave(saved);
            onClose();
        } catch (error) {
            toast.error("Error al guardar la historia clínica");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const sections = [
        { id: "consultation", label: "Consulta", icon: Activity },
        { id: "personal", label: "Personal", icon: User },
        { id: "social", label: "Social", icon: Heart },
        { id: "medical", label: "Médica", icon: Activity },
        { id: "nutrition", label: "Nutrición", icon: Utensils },
        { id: "preferences", label: "Preferencias", icon: Settings },
        { id: "observations", label: "Observaciones extra", icon: Paperclip },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full bg-gray-50/50">
            <header className="p-4 border-b bg-white flex items-center justify-between sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Historia Clínica</h2>
                    <p className="text-sm text-gray-500">{patient.first_name} {patient.last_name}</p>
                </div>
                <div className="flex items-center gap-2">
                    {hasHistory && (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                className="mr-2 gap-2"
                                onClick={() => navigate(`/mis-pacientes/${patient.id}/antropometria`)}
                            >
                                <Activity className="h-4 w-4" />
                                Datos Antropométricos
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="mr-2 gap-2"
                                onClick={() => navigate(`/mis-pacientes/${patient.id}/analitica`)}
                            >
                                <Activity className="h-4 w-4" />
                                Datos Analíticos
                            </Button>
                        </>
                    )}
                    <Button type="button" variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                    <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90">
                        {isSaving ? "Guardando..." : "Guardar"}
                        <Save className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <nav className="w-64 border-r bg-white overflow-y-auto p-4 hidden md:block">
                    <ul className="space-y-1">
                        {sections.map(section => (
                            <li key={section.id}>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === section.id
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                >
                                    <section.icon className="h-4 w-4" />
                                    {section.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Section: Consultation */}
                    {activeSection === "consultation" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Preguntas Generales de Consulta</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="c-reason">Motivo de consulta</Label>
                                        <Textarea id="c-reason" {...register("motivo_consulta")} placeholder="¿Por qué acude a consulta?" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="c-expectations">Expectativas</Label>
                                        <Textarea id="c-expectations" {...register("expectativas")} placeholder="¿Qué espera lograr?" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="c-past">Experiencias pasadas con nutricionistas</Label>
                                        <Textarea id="c-past" {...register("experiencias_pasadas_nutricionistas")} placeholder="¿Ha consultado antes?" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section: Personal */}
                    {activeSection === "personal" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Datos Personales</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>País de residencia</Label>
                                        <Select {...register("pais_residencia")}>
                                            <option value="">Seleccionar país...</option>
                                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Objetivo</Label>
                                        <Select {...register("objetivo")}>
                                            <option value="perder_grasa">Perder grasa</option>
                                            <option value="mantener_peso">Mantener peso</option>
                                            <option value="ganar_musculo">Ganar músculo</option>
                                            <option value="otro">Otro</option>
                                        </Select>
                                        {watch("objetivo") === "otro" && (
                                            <Input {...register("_temp_goal_other")} placeholder="Especificar objetivo..." className="mt-2" />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Peso objetivo (estimativo)</Label>
                                        <Input {...register("peso_objetivo")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Velocidad</Label>
                                        <Select {...register("velocidad")}>
                                            <option value="rapido">Rápido</option>
                                            <option value="recomendado">Recomendado</option>
                                            <option value="lento">Lento</option>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Sexo</Label>
                                        <Select {...register("sexo")}>
                                            <option value="hombre">Hombre</option>
                                            <option value="mujer">Mujer</option>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fecha de nacimiento</Label>
                                        <Input type="date" {...register("fecha_nacimiento")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Estatura (cm)</Label>
                                        <Input type="number" {...register("estatura", { valueAsNumber: true })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Peso (kg)</Label>
                                        <Input type="number" {...register("peso", { valueAsNumber: true })} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <input type="checkbox" id="phys-act" {...register("realiza_actividad_fisica")} className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                                            <Label htmlFor="phys-act">¿Realizas alguna actividad física?</Label>
                                        </div>
                                        {watch("realiza_actividad_fisica") && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">¿Qué actividad?</Label>
                                                    <Input {...register("actividad_fisica_realiza")} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Frecuencia y duración</Label>
                                                    <Input {...register("frecuencia_duracion_actividad")} placeholder="Ej: 3 veces/semana, 1 hora" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="str-train" {...register("entrenamientos_fuerza")} className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                                            <Label htmlFor="str-train">¿Realizas entrenamientos de fuerza?</Label>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nivel de actividad física</Label>
                                        <Select {...register("nivel_actividad_fisica")}>
                                            <option value="baja">Baja</option>
                                            <option value="media">Media</option>
                                            <option value="alta">Alta</option>
                                            <option value="atleta">Atleta</option>
                                        </Select>
                                    </div>
                                </CardContent>
                                <Separator />
                                <CustomQuestionsSection control={control} register={register} name="preguntas_adicionales_personales" />
                            </Card>
                        </div>
                    )}

                    {/* Section: Social */}
                    {activeSection === "social" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Historia Personal y Social</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-3">
                                        <Label>Función intestinal</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {['Normal', 'Estreñimiento', 'Diarrea', 'Irregular', 'Acidez', 'Distensión abdominal', 'Náuseas', 'Vómitos frecuentes', 'Gastritis'].map(opt => (
                                                <div key={opt} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`if-${opt}`}
                                                        value={opt}
                                                        {...register("funcion_intestinal")}
                                                        className="rounded border-gray-300 text-primary h-4 w-4"
                                                    />
                                                    <Label htmlFor={`if-${opt}`} className="text-xs font-normal">{opt}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Calidad de sueño</Label>
                                            <Input {...register("calidad_sueno")} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Horas de sueño promedio</Label>
                                            <Input type="number" {...register("horas_sueno_promedio", { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nivel de estrés (1-10)</Label>
                                            <div className="flex items-center gap-4">
                                                <input type="range" min="1" max="10" {...register("nivel_estres")} className="flex-1 accent-primary" />
                                                <span className="font-bold text-lg w-8">{watch("nivel_estres")}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Factores de estrés</Label>
                                            <Input {...register("estres_asociado_especial")} placeholder="¿Lo asocias con algo?" />
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id="smoker" {...register("fumador")} className="rounded border-gray-300 text-primary h-4 w-4" />
                                                <Label htmlFor="smoker">Fumador</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id="alcohol" {...register("bebe_alcohol.value")} className="rounded border-gray-300 text-primary h-4 w-4" />
                                                <Label htmlFor="alcohol">Bebe alcohol</Label>
                                            </div>
                                        </div>
                                        {watch("bebe_alcohol.value") && (
                                            <div className="space-y-2">
                                                <Label>¿Cuánto alcohol?</Label>
                                                <Input {...register("bebe_alcohol.amount")} />
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label>Estado civil</Label>
                                            <Input {...register("estado_civil")} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Información adicional relevante</Label>
                                            <Textarea {...register("informacion_adicional_relevante")} />
                                        </div>
                                    </div>
                                </CardContent>
                                <Separator />
                                <CustomQuestionsSection control={control} register={register} name="preguntas_adicionales_social" />
                            </Card>
                        </div>
                    )}

                    {/* Section: Medical History */}
                    {activeSection === "medical" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Historia Clínica</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Patologías actuales</Label>
                                        <Textarea {...register("patologias_actuales")} />
                                    </div>

                                    <BackgroundCheckGroup
                                        label="Antecedentes personales"
                                        register={register}
                                        name="antecedentes_personales"
                                        otherName="_temp_personal_other"
                                        watch={watch}
                                    />

                                    <BackgroundCheckGroup
                                        label="Antecedentes familiares"
                                        register={register}
                                        name="antecedentes_familiares"
                                        otherName="_temp_family_other"
                                        watch={watch}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Medicación</Label>
                                            <Textarea {...register("medicacion")} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Historial de embarazo</Label>
                                            <Textarea {...register("historial_embarazo")} />
                                        </div>
                                    </div>
                                </CardContent>
                                <Separator />
                                <CustomQuestionsSection control={control} register={register} name="preguntas_adicionales_clinica" />
                            </Card>
                        </div>
                    )}

                    {/* Section: Nutrition */}
                    {activeSection === "nutrition" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Nutrición y Alimentación</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Hora de acostarse habitual</Label>
                                            <Input type="time" {...register("hora_acostarse")} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Hora de levantarse habitual</Label>
                                            <Input type="time" {...register("hora_levantarse")} />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <input type="checkbox" id="fasting" {...register("ayuno_intermitente.value")} className="rounded border-gray-300 text-primary h-4 w-4" />
                                                <Label htmlFor="fasting">Ayuno intermitente</Label>
                                            </div>
                                            {watch("ayuno_intermitente.value") && (
                                                <div className="flex items-center gap-2">
                                                    <Input type="number" {...register("ayuno_intermitente.hours", { valueAsNumber: true })} className="w-24" />
                                                    <span className="text-sm">horas</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <input type="checkbox" id="vegan" {...register("vegano")} className="rounded border-gray-300 text-primary h-4 w-4" />
                                                <Label htmlFor="vegan">¿Es vegano?</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id="celiac" {...register("celiaquia_intolerancia_gluten")} className="rounded border-gray-300 text-primary h-4 w-4" />
                                                <Label htmlFor="celiac">¿Tiene celiaquía o intolerancia al gluten?</Label>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Otro tipo de dieta</Label>
                                            <Input {...register("otro_tipo_dieta")} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Ingesta de agua promedio</Label>
                                            <Input {...register("ingesta_agua_promedio")} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Alimentos que consume</Label>
                                        <div className="flex flex-wrap gap-4">
                                            {[
                                                { id: 'proteinas', label: 'Proteínas' },
                                                { id: 'carbohidratos', label: 'Carbohidratos' },
                                                { id: 'grasas', label: 'Grasas' },
                                                { id: 'lacteos', label: 'Lácteos' },
                                                { id: 'frutas', label: 'Frutas' },
                                            ].map(food => (
                                                <div key={food.id} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border">
                                                    <input
                                                        type="checkbox"
                                                        id={`food-${food.id}`}
                                                        {...register(`alimentos_consumidos.${food.id as keyof ClinicalHistory['alimentos_consumidos']}` as any)}
                                                        className="rounded border-gray-300 text-primary h-4 w-4"
                                                    />
                                                    <Label htmlFor={`food-${food.id}`} className="text-sm font-medium cursor-pointer">{food.label}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Alergias o intolerancias</Label>
                                            <Input {...register("alergias_intolerancias")} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Deficiencias nutricionales conocidas</Label>
                                            <Input {...register("deficiencia_nutricional")} />
                                        </div>
                                    </div>
                                </CardContent>
                                <Separator />
                                <CustomQuestionsSection control={control} register={register} name="preguntas_adicionales_nutricionales" />
                            </Card>
                        </div>
                    )}

                    {/* Section: Preferences */}
                    {activeSection === "preferences" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Plan y Menú</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold">¿Cómo te gustaría visualizar las porciones?</Label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1">
                                                <input type="radio" value="medidas_caseras" {...register("visualizacion_porciones")} className="accent-primary" />
                                                <span className="text-sm">Medidas caseras</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1">
                                                <input type="radio" value="gramos" {...register("visualizacion_porciones")} className="accent-primary" />
                                                <span className="text-sm">Gramos</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold">¿Quisieras poder visualizar las calorías que vas consumiendo o sólo los macronutrientes?</Label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1">
                                                <input type="radio" value="visibles" {...register("visualizacion_calorias")} className="accent-primary" />
                                                <span className="text-sm">Calorías visibles</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1">
                                                <input type="radio" value="no_visibles" {...register("visualizacion_calorias")} className="accent-primary" />
                                                <span className="text-sm">Calorías no visibles</span>
                                            </label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section: Observations and Files */}
                    {activeSection === "observations" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Observaciones y Archivos</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="obs-extra">Observaciones extra</Label>
                                        <Textarea
                                            id="obs-extra"
                                            {...register("observaciones_extra")}
                                            placeholder="Ingrese observaciones adicionales aquí..."
                                            className="min-h-[100px]"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold">Archivos adjuntos</Label>

                                        {/* File Upload Area */}
                                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
                                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-600 mb-1">
                                                Haga clic para subir archivos
                                            </p>
                                            <p className="text-xs text-gray-400 mb-4">
                                                (PDF, Imágenes, Texto)
                                            </p>
                                            <Input
                                                type="file"
                                                className="max-w-xs"
                                                accept=".pdf,.txt,image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    const toastId = toast.loading("Subiendo archivo...");
                                                    try {
                                                        const response = await filesService.uploadImage(file);
                                                        // Response is now UploadedFile[]
                                                        if (response && response.length > 0 && response[0].Location) {
                                                            const currentFiles = watch("archivos") || [];
                                                            const newFiles = [...currentFiles, response[0].Location];
                                                            setValue("archivos", newFiles);
                                                        }
                                                        toast.success("Archivo subido correctamente", { id: toastId });
                                                    } catch (error) {
                                                        console.error(error);
                                                        toast.error("Error al subir el archivo", { id: toastId });
                                                    }
                                                    // Clear input
                                                    e.target.value = "";
                                                }}
                                            />
                                        </div>

                                        {/* Files List */}
                                        <div className="space-y-2">
                                            {(watch("archivos") || []).length > 0 ? (
                                                (watch("archivos") || []).map((url, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                                                            <a
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-blue-600 hover:underline truncate"
                                                                title={url}
                                                            >
                                                                {url.split('/').pop() || "Archivo adjunto"}
                                                            </a>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-gray-400 hover:text-red-500"
                                                            onClick={() => {
                                                                const newFiles = (watch("archivos") || []).filter((_, i) => i !== index);
                                                                setValue("archivos", newFiles);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500 text-center italic">
                                                    No hay archivos adjuntos
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Navigation (Bottom) */}
            <div className="md:hidden p-2 border-t bg-white overflow-x-auto">
                <div className="flex gap-2">
                    {sections.map(section => (
                        <Button
                            key={section.id}
                            type="button"
                            variant={activeSection === section.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveSection(section.id)}
                            className="whitespace-nowrap rounded-full"
                        >
                            <section.icon className="h-4 w-4 mr-1" />
                            {section.label}
                        </Button>
                    ))}
                </div>
            </div>
        </form>
    );
}

function CustomQuestionsSection({ control, register, name }: { control: Control<ClinicalHistory>, register: UseFormRegister<ClinicalHistory>, name: any }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name
    });

    return (
        <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-bold">Preguntas adicionales</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ question: "", answer: "" })}
                    className="h-8"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                </Button>
            </div>
            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg bg-gray-50 relative group">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => remove(index)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <div className="space-y-3">
                            <Input
                                {...register(`${name}.${index}.question` as any)}
                                placeholder="Escribe tu pregunta aquí..."
                                className="bg-white"
                            />
                            <Textarea
                                {...register(`${name}.${index}.answer` as any)}
                                placeholder="Respuesta..."
                                className="bg-white min-h-[60px]"
                            />
                        </div>
                    </div>
                ))}
                {fields.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4 bg-gray-50/50 rounded-lg border-dashed border-2">
                        No hay preguntas personalizadas añadidas.
                    </p>
                )}
            </div>
        </CardContent>
    );
}

function BackgroundCheckGroup({ label, register, name, otherName, watch }: { label: string, register: UseFormRegister<ClinicalHistory>, name: any, otherName: any, watch: UseFormWatch<ClinicalHistory> }) {
    const options = [
        { value: 'Diabetes tipo 1', label: 'Diabetes insulino requirente (tipo 1)' },
        { value: 'Diabetes tipo 2', label: 'Diabetes no insulino requiriente (tipo 2)' },
        { value: 'Hipertensión arterial', label: 'Hipertensión arterial' },
        { value: 'Enfermedad cardiovascular', label: 'Enfermedad cardiovascular' },
        { value: 'Dislipemias', label: 'Dislipemias/alteración del colesterol o triglicéridos' },
        { value: 'Celiaquía', label: 'Celiaquía' },
        { value: 'Problemas renales', label: 'Problemas renales' },
        { value: 'Ninguna', label: 'Ninguna' },
        { value: 'Otra', label: 'Otra' },
    ];

    const currentValues = watch(name) || [];

    return (
        <div className="space-y-3">
            <Label className="font-bold">{label}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {options.map(opt => (
                    <div key={opt.value} className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id={`${name}-${opt.value}`}
                            value={opt.value}
                            {...register(name)}
                            className="rounded border-gray-300 text-primary h-4 w-4"
                        />
                        <Label htmlFor={`${name}-${opt.value}`} className="text-xs font-normal cursor-pointer">{opt.label}</Label>
                    </div>
                ))}
            </div>
            {currentValues.includes('Otra') && (
                <div className="mt-2 pl-6">
                    <Label className="text-xs">Especificar otra:</Label>
                    <Input {...register(otherName)} className="mt-1" />
                </div>
            )}
        </div>
    );
}
