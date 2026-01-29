import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetScheduleProfessional, useCreateSchedule, useGetEventTypes } from "@/hooks/schedule/use-schedule";
import { Settings, Plus, Trash2, Save } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { CalEvent, EventTypeConfig, AvailableSlot } from "../googleCalendar/SimpleCalendar";
import SimpleCalendar from "../googleCalendar/SimpleCalendar";

type TimeRange = {
    id: string;
    startTime: string;
    endTime: string;
};

type DaySchedule = {
    enabled: boolean;
    timeRanges: TimeRange[];
    duration: number;
};

type WeeklySchedule = {
    [key: string]: DaySchedule;
};

export function Schedule() {
    const userLogged = JSON.parse(localStorage.getItem('data') || '{}');
    const loggedUserId = userLogged.id;

    const { data: scheduleData, isLoading: isLoadingSchedule } = useGetScheduleProfessional(loggedUserId);
    const { data: eventTypesData, isLoading: isLoadingEventTypes } = useGetEventTypes();
    const createScheduleMutation = useCreateSchedule();

    const generateId = () => Math.random().toString(36).substr(2, 9);

    // Obtener eventTypes desde la API con fallback por si la API falla
    const eventTypes: EventTypeConfig[] = eventTypesData?.data?.eventTypes || [
        {
            id: "consulta",
            name: "Consulta Médica",
            description: "Consulta general con el profesional",
            color: "#e3f2fd",
            textColor: "#1976d2"
        }
    ];

    // Estado inicial por defecto
    const defaultWeeklySchedule: WeeklySchedule = {
        lunes: {
            enabled: true,
            timeRanges: [{ id: generateId(), startTime: "09:00", endTime: "17:00" }],
            duration: 30
        },
        martes: {
            enabled: true,
            timeRanges: [{ id: generateId(), startTime: "09:00", endTime: "17:00" }],
            duration: 30
        },
        miércoles: {
            enabled: true,
            timeRanges: [{ id: generateId(), startTime: "09:00", endTime: "17:00" }],
            duration: 30
        },
        jueves: {
            enabled: true,
            timeRanges: [{ id: generateId(), startTime: "09:00", endTime: "17:00" }],
            duration: 30
        },
        viernes: {
            enabled: true,
            timeRanges: [{ id: generateId(), startTime: "09:00", endTime: "17:00" }],
            duration: 30
        },
        sábado: {
            enabled: false,
            timeRanges: [{ id: generateId(), startTime: "09:00", endTime: "13:00" }],
            duration: 30
        },
        domingo: {
            enabled: false,
            timeRanges: [{ id: generateId(), startTime: "09:00", endTime: "13:00" }],
            duration: 30
        },
    };

    const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(defaultWeeklySchedule);
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [events, setEvents] = useState<CalEvent[]>([]);
    const [, setCurrentDate] = useState<Date>(new Date());
    const [isSaving, setIsSaving] = useState(false); // Cambiado a isSaving
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Para el botón

    // Refs para el debounce
    const saveTimeoutRef = useRef<number | null>(null);
    const lastSavedScheduleRef = useRef<WeeklySchedule>(defaultWeeklySchedule);

    // Mapeo de días a números
    const dayMap: { [key: string]: number } = {
        'lunes': 1,
        'martes': 2,
        'miércoles': 3,
        'jueves': 4,
        'viernes': 5,
        'sábado': 6,
        'domingo': 0
    };

    // Mapeo inverso de números a días
    const reverseDayMap: { [key: number]: string } = {
        1: 'lunes',
        2: 'martes',
        3: 'miércoles',
        4: 'jueves',
        5: 'viernes',
        6: 'sábado',
        0: 'domingo'
    };

    // Función para convertir weeklySchedule a availableSlots
    const convertToAvailableSlots = useCallback((schedule: WeeklySchedule): AvailableSlot[] => {
        const slots: AvailableSlot[] = [];

        Object.entries(schedule).forEach(([day, daySchedule]) => {
            if (daySchedule.enabled) {
                daySchedule.timeRanges.forEach((timeRange, index) => {
                    slots.push({
                        id: `slot-${day}-${index}-${timeRange.startTime}-${timeRange.endTime}`,
                        professionalId: loggedUserId.toString(),
                        professionalName: `${userLogged.first_name} ${userLogged.last_name}`,
                        dayOfWeek: dayMap[day],
                        startTime: timeRange.startTime,
                        endTime: timeRange.endTime,
                        recurring: true,
                        color: "#e3f2fd",
                        borderColor: "#bbdefb",
                        note: `Duración: ${daySchedule.duration}min`,
                        duration: daySchedule.duration
                    });
                });
            }
        });

        return slots;
    }, [loggedUserId, userLogged.first_name, userLogged.last_name]);

    // Cargar datos existentes cuando lleguen del API
    useEffect(() => {
        if (scheduleData?.data && scheduleData.data.length > 0) {
            const existingSchedules = scheduleData.data;

            // Crear una copia del estado por defecto
            const newWeeklySchedule = { ...defaultWeeklySchedule };

            const schedulesByDay: { [key: number]: any[] } = {};
            existingSchedules.forEach(schedule => {
                if (!schedulesByDay[schedule.dayOfWeek]) {
                    schedulesByDay[schedule.dayOfWeek] = [];
                }
                schedulesByDay[schedule.dayOfWeek].push(schedule);
            });

            // Actualizar solo los días que tienen datos en la API
            Object.entries(schedulesByDay).forEach(([dayNumber, schedules]) => {
                const dayKey = reverseDayMap[parseInt(dayNumber)];
                if (dayKey && newWeeklySchedule[dayKey]) {
                    newWeeklySchedule[dayKey].enabled = true;
                    newWeeklySchedule[dayKey].timeRanges = schedules.map(schedule => ({
                        id: generateId(),
                        startTime: schedule.startTime.substring(0, 5),
                        endTime: schedule.endTime.substring(0, 5)
                    }));
                    if (schedules[0].duration) {
                        newWeeklySchedule[dayKey].duration = schedules[0].duration;
                    }
                }
            });

            // Los días que no tienen datos en la API mantienen su estado por defecto
            setWeeklySchedule(newWeeklySchedule);
            lastSavedScheduleRef.current = newWeeklySchedule;
        }
    }, [scheduleData]);

    // Actualizar availableSlots cuando cambie weeklySchedule
    useEffect(() => {
        const newSlots = convertToAvailableSlots(weeklySchedule);
        setAvailableSlots(newSlots);
    }, [weeklySchedule, convertToAvailableSlots]);

    // Función para guardar automáticamente con debounce
    const autoSaveSchedules = useCallback(async (schedule: WeeklySchedule) => {
        try {
            setIsSaving(true); // Mostrar que está guardando

            const schedulesToSave: any[] = [];

            Object.entries(schedule).forEach(([day, daySchedule]) => {
                if (daySchedule.enabled) {
                    daySchedule.timeRanges.forEach(timeRange => {
                        schedulesToSave.push({
                            professionalId: parseInt(loggedUserId),
                            dayOfWeek: dayMap[day],
                            startTime: timeRange.startTime + ":00",
                            endTime: timeRange.endTime + ":00",
                            duration: daySchedule.duration,
                            recurring: true,
                            color: "#e3f2fd",
                            borderColor: "#bbdefb"
                        });
                    });
                }
            });

            if (schedulesToSave.length === 0) {
                setIsSaving(false);
                setHasUnsavedChanges(false);
                return;
            }

            await createScheduleMutation.mutateAsync(schedulesToSave);
            lastSavedScheduleRef.current = schedule;
            setHasUnsavedChanges(false);

            // Mostrar toast solo si no es la carga inicial
            if (JSON.stringify(schedule) !== JSON.stringify(defaultWeeklySchedule)) {
                toast.success("Horarios guardados automáticamente");
            }

        } catch (error) {
            console.error('Error guardando horarios automáticamente:', error);
            toast.error("Error al guardar los horarios automáticamente");
        } finally {
            setIsSaving(false); // Siempre ocultar el indicador de guardado
        }
    }, [loggedUserId, createScheduleMutation, defaultWeeklySchedule]);

    // Efecto para guardado automático con debounce - CORREGIDO
    useEffect(() => {
        // No guardar si es la carga inicial o no hay cambios
        if (JSON.stringify(weeklySchedule) === JSON.stringify(lastSavedScheduleRef.current)) {
            setHasUnsavedChanges(false);
            return;
        }

        setHasUnsavedChanges(true);

        // Limpiar timeout anterior
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Establecer nuevo timeout (1 segundo de debounce)
        saveTimeoutRef.current = window.setTimeout(() => {
            autoSaveSchedules(weeklySchedule);
        }, 1000);

        // Cleanup
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [weeklySchedule, autoSaveSchedules]);

    // Función para actualizar el schedule
    const updateSchedule = useCallback((updater: (prev: WeeklySchedule) => WeeklySchedule) => {
        setWeeklySchedule(prev => {
            const newSchedule = updater(prev);
            return newSchedule;
        });
    }, []);

    const updateTimeRange = (day: string, rangeId: string, field: keyof TimeRange, value: string) => {
        updateSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                timeRanges: prev[day].timeRanges.map(range =>
                    range.id === rangeId ? { ...range, [field]: value } : range
                )
            }
        }));
    };

    const updateDuration = (day: string, duration: number) => {
        updateSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                duration
            }
        }));
    };

    const addTimeRange = (day: string) => {
        updateSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                timeRanges: [
                    ...prev[day].timeRanges,
                    { id: generateId(), startTime: "09:00", endTime: "17:00" }
                ]
            }
        }));
    };

    const removeTimeRange = (day: string, rangeId: string) => {
        updateSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                timeRanges: prev[day].timeRanges.filter(range => range.id !== rangeId)
            }
        }));
    };

    const toggleDay = (day: string) => {
        updateSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                enabled: !prev[day].enabled
            }
        }));
    };

    const applyToAllActive = (startTime: string, endTime: string) => {
        updateSchedule(prev => {
            const newSchedule = { ...prev };

            Object.keys(newSchedule).forEach(day => {
                if (newSchedule[day].enabled) {
                    newSchedule[day] = {
                        ...newSchedule[day],
                        timeRanges: [{
                            id: generateId(),
                            startTime,
                            endTime
                        }]
                    };
                }
            });

            return newSchedule;
        });
    };

    const applyDurationToAll = (duration: number) => {
        updateSchedule(prev => {
            const newSchedule = { ...prev };

            Object.keys(newSchedule).forEach(day => {
                if (newSchedule[day].enabled) {
                    newSchedule[day] = {
                        ...newSchedule[day],
                        duration
                    };
                }
            });

            return newSchedule;
        });
    };

    const isTimeRangeValid = (startTime: string, endTime: string) => {
        return startTime < endTime;
    };

    // Función para guardar manualmente
    const saveSchedules = async () => {
        try {
            await autoSaveSchedules(weeklySchedule);
        } catch (error) {
            console.error('Error guardando horarios:', error);
            toast.error("Error al guardar los horarios");
        }
    };

    // Handlers para el calendario
    const handleEventsChange = (newEvents: CalEvent[]) => {
        setEvents(newEvents);
    };

    const handleDateChange = (newDate: Date) => {
        setCurrentDate(newDate);
    };

    const days = [
        { key: 'lunes', label: 'Lun' },
        { key: 'martes', label: 'Mar' },
        { key: 'miércoles', label: 'Mié' },
        { key: 'jueves', label: 'Jue' },
        { key: 'viernes', label: 'Vie' },
        { key: 'sábado', label: 'Sáb' },
        { key: 'domingo', label: 'Dom' }
    ];

    const commonHours = [
        { start: "08:00", end: "17:00", label: "8:00-17:00" },
        { start: "09:00", end: "18:00", label: "9:00-18:00" },
        { start: "07:00", end: "16:00", label: "7:00-16:00" },
        { start: "10:00", end: "19:00", label: "10:00-19:00" },
    ];

    const durationOptions = [15, 20, 30, 45, 60, 90, 120];

    if (isLoadingSchedule || isLoadingEventTypes) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg text-gray-500">Cargando horarios...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Tus horarios</h1>
                <p className="text-gray-600">Configura tus horarios disponibles y visualízalos en el calendario</p>
                {/* SOLO mostrar cuando realmente se está guardando */}
                {isSaving && (
                    <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                        💾 Guardando cambios automáticamente...
                    </div>
                )}
            </div>

            {/* Configuración */}
            <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="flex items-center gap-4 p-4">
                    <Settings className="text-gray-500 h-6 w-6" />
                    <div className="flex-1">
                        <p className="text-gray-800 font-medium">
                            Configura tu horario semanal
                        </p>
                        <p className="text-sm text-gray-500">
                            Los cambios se guardan automáticamente
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Panel de configuración de horarios */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Configuración de Horarios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Días de la semana */}
                    <div className="space-y-3">
                        {days.map(({ key, label }) => (
                            <div key={key} className="p-3 border border-gray-200 rounded-lg space-y-2">
                                {/* Header del día */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={weeklySchedule[key].enabled}
                                            onChange={() => toggleDay(key)}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                        />
                                        <span className={`text-sm font-medium ${weeklySchedule[key].enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {label}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <label className="text-xs text-gray-600 whitespace-nowrap">Duración:</label>
                                            <select
                                                value={weeklySchedule[key].duration}
                                                onChange={(e) => updateDuration(key, parseInt(e.target.value))}
                                                disabled={!weeklySchedule[key].enabled}
                                                className="text-xs border border-gray-300 rounded px-2 py-1 disabled:bg-gray-100 disabled:text-gray-400 w-20"
                                            >
                                                {durationOptions.map(minutes => (
                                                    <option key={minutes} value={minutes}>
                                                        {minutes} min
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className={`text-xs px-2 py-1 rounded ${weeklySchedule[key].enabled
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {weeklySchedule[key].enabled ? 'Activo' : 'Inactivo'}
                                        </div>

                                        {weeklySchedule[key].enabled && (
                                            <button
                                                onClick={() => addTimeRange(key)}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Agregar horario"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {weeklySchedule[key].enabled && (
                                    <div className="space-y-2 pl-6">
                                        {weeklySchedule[key].timeRanges.map((range) => (
                                            <div key={range.id} className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 flex-1">
                                                    <div className="w-24">
                                                        <input
                                                            type="time"
                                                            value={range.startTime}
                                                            onChange={(e) => updateTimeRange(key, range.id, 'startTime', e.target.value)}
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                                                        />
                                                    </div>

                                                    <span className="text-xs text-gray-400">-</span>

                                                    <div className="w-24">
                                                        <input
                                                            type="time"
                                                            value={range.endTime}
                                                            onChange={(e) => updateTimeRange(key, range.id, 'endTime', e.target.value)}
                                                            className={`w-full px-2 py-1 text-sm border rounded ${isTimeRangeValid(range.startTime, range.endTime)
                                                                ? 'border-gray-300 text-gray-900'
                                                                : 'border-red-300 text-red-900 bg-red-50'
                                                                }`}
                                                        />
                                                    </div>

                                                    {!isTimeRangeValid(range.startTime, range.endTime) && (
                                                        <span className="text-xs text-red-500 ml-1">Hora inválida</span>
                                                    )}
                                                </div>

                                                {weeklySchedule[key].timeRanges.length > 1 && (
                                                    <button
                                                        onClick={() => removeTimeRange(key, range.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Eliminar horario"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Plantillas rápidas:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {commonHours.map((template, index) => (
                                <button
                                    key={index}
                                    onClick={() => applyToAllActive(template.start, template.end)}
                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200 transition-colors"
                                >
                                    {template.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Aplicar duración a todos:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {durationOptions.map(minutes => (
                                <button
                                    key={minutes}
                                    onClick={() => applyDurationToAll(minutes)}
                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded border border-blue-200 hover:bg-blue-200 transition-colors"
                                >
                                    {minutes} min
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Botón de guardado manual (opcional) */}
                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            {isSaving ? "💾 Guardando..." : hasUnsavedChanges ? "📝 Cambios sin guardar" : "✅ Todos los cambios guardados"}
                        </div>
                        <button
                            onClick={saveSchedules}
                            disabled={createScheduleMutation.isPending || !hasUnsavedChanges}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                        >
                            <Save className="h-4 w-4" />
                            {createScheduleMutation.isPending ? "Guardando..." : "Guardar Ahora"}
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Panel del calendario */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Vista Previa del Calendario</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-gray-600 mb-4">
                        Los horarios configurados se muestran como áreas azules en el calendario.
                        Estas áreas representan los horarios disponibles para que los pacientes agenden turnos.
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                        <SimpleCalendar
                            events={events}
                            eventTypes={eventTypes}
                            availableSlots={availableSlots}
                            onEventsChange={handleEventsChange}
                            readOnly={true}
                            onCurrentDateChange={handleDateChange}
                            restrictToAvailableSlots={true}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
