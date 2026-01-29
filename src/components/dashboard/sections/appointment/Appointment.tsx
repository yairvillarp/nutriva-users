import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scheduleService } from "@/services/schedules/services";
import { useGetScheduleProfessional, useGetEventTypes } from "@/hooks/schedule/use-schedule";
import {
    useCreateAppointment,
    useUpdateAppointment,
    useDeleteAppointment,
    useGetAppointmentsByProfessional
} from "@/hooks/appointments/use-appointments";
import { useGetCurrentUser, useUpdateUserPhone } from "@/hooks/user/users";
import { Settings, Loader2, Phone, Edit3, Check, X } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import AsyncSelect from 'react-select/async';
import type { CalEvent, EventTypeConfig, AvailableSlot } from "../googleCalendar/SimpleCalendar";
import SimpleCalendar from "../googleCalendar/SimpleCalendar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Appointment() {
    const userLogged = JSON.parse(localStorage.getItem('data') || '{}');
    const loggedUserId = userLogged.id;
    const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [events, setEvents] = useState<CalEvent[]>([]);
    const [, setCurrentDate] = useState<Date>(new Date());
    const [isProcessing, setIsProcessing] = useState(false);
    const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

    const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [tempPhone, setTempPhone] = useState('');

    const { data: eventTypesData, isLoading: isLoadingEventTypes } = useGetEventTypes();
    const { data: currentUserData, isLoading: isLoadingUser, refetch: refetchUser } = useGetCurrentUser();
    const { data: scheduleData, isLoading: isLoadingSchedule } = useGetScheduleProfessional(
        selectedProfessional?.value?.toString()
    );
    const { data: appointmentsData, isLoading: isLoadingAppointments, refetch: refetchAppointments } = useGetAppointmentsByProfessional(
        selectedProfessional?.value?.toString()
    );

    const createAppointmentMutation = useCreateAppointment();
    const updateAppointmentMutation = useUpdateAppointment();
    const deleteAppointmentMutation = useDeleteAppointment();
    const updateUserPhoneMutation = useUpdateUserPhone();

    const eventTypes: EventTypeConfig[] = eventTypesData?.data?.eventTypes || [
        {
            id: "consulta",
            name: "Consulta Médica",
            description: "Consulta general con el profesional",
            color: "#e3f2fd",
            textColor: "#1976d2"
        }
    ];

    const currentUser = currentUserData;
    const userPhone = currentUser?.phone;
    const hasPhone = userPhone && userPhone.trim() !== '';

    useEffect(() => {
        if (userPhone) {
            setTempPhone(userPhone);
        }
    }, [userPhone]);

    useEffect(() => {
        if (scheduleData?.data && selectedProfessional) {
            const slots: AvailableSlot[] = [];

            scheduleData.data.forEach(schedule => {
                // Asegurar que la duración se pase correctamente
                const duration = schedule.duration || 60; // Valor por defecto de 60 minutos

                slots.push({
                    id: `slot-${schedule.id}`,
                    professionalId: selectedProfessional.value.toString(),
                    professionalName: selectedProfessional.label,
                    dayOfWeek: schedule.dayOfWeek,
                    startTime: schedule.startTime.substring(0, 5),
                    endTime: schedule.endTime.substring(0, 5),
                    recurring: schedule.recurring,
                    color: schedule.color || "#e3f2fd",
                    borderColor: schedule.borderColor || "#bbdefb",
                    note: `Duración: ${duration}min`,
                    duration: duration // Asegurar que este campo esté presente
                });
            });

            setAvailableSlots(slots);
        }
    }, [scheduleData, selectedProfessional]);

    const loadProfessionals = useCallback(async (inputValue: string) => {
        try {
            const response = await scheduleService.getProfessionals(inputValue);

            if (response.success) {
                return response.data.map(professional => ({
                    value: professional.id,
                    label: `${professional.first_name} ${professional.last_name}`,
                    data: professional
                }));
            }
            return [];
        } catch (error) {
            console.error('Error cargando profesionales:', error);
            return [];
        }
    }, []);

    const handleProfessionalChange = (selectedOption: any) => {
        setSelectedProfessional(selectedOption);
        setAvailableSlots([]);
        setEvents([]);
    };

    const handleStartEditPhone = () => {
        setTempPhone(userPhone || '');
        setIsEditingPhone(true);
    };

    const handleCancelEditPhone = () => {
        setTempPhone(userPhone || '');
        setIsEditingPhone(false);
    };

    const handleSaveEditPhone = async () => {
        if (!tempPhone.trim()) {
            toast.error("Por favor ingresa un número de teléfono");
            return;
        }

        setIsUpdatingPhone(true);
        try {
            await updateUserPhoneMutation.mutateAsync({
                id: loggedUserId.toString(),
                phone: tempPhone.trim()
            });

            toast.success("Teléfono actualizado exitosamente");
            setIsEditingPhone(false);

            await refetchUser();
        } catch (error) {
            console.error('Error actualizando teléfono:', error);
            toast.error("Error al actualizar el teléfono");
        } finally {
            setIsUpdatingPhone(false);
        }
    };

    const canManageAppointments = () => {
        return hasPhone && !isLoadingUser;
    };

    // CORRECCIÓN: Mostrar TODOS los turnos del profesional, no filtrar
    useEffect(() => {
        if (appointmentsData?.data) {
            // Mostrar TODOS los turnos del profesional seleccionado
            setEvents(appointmentsData.data);
        }
    }, [appointmentsData]);


    const transformEventForBackend = (event: CalEvent) => {
        const defaultTimeZone = "America/Argentina/Buenos_Aires";

        return {
            id: event.id,
            summary: event.summary,
            description: event.description,
            start: {
                dateTime: event.start.dateTime,
                timeZone: event.start.timeZone || defaultTimeZone
            },
            end: {
                dateTime: event.end.dateTime,
                timeZone: event.end.timeZone || defaultTimeZone
            },
            timeZone: event.start.timeZone || defaultTimeZone,
            eventType: event.eventType,
            status: (event as any).status || 'scheduled',
            patientId: loggedUserId.toString(),
            professionalId: selectedProfessional?.value?.toString()
        };
    };

    const handleSaveEvent = async (event: CalEvent): Promise<CalEvent> => {
        if (!canManageAppointments()) {
            toast.error("Debes tener un número de teléfono registrado para agendar turnos");
            throw new Error("Teléfono requerido");
        }

        setIsProcessing(true);
        try {
            const eventForBackend: any = transformEventForBackend(event);

            const response: any = await createAppointmentMutation.mutateAsync(eventForBackend);

            if (!response.data) {
                throw new Error('No se recibieron datos del servidor');
            }

            toast.success("Turno agendado exitosamente");

            await refetchAppointments();

            return response.data;

        } catch (error) {
            console.error('Error guardando evento:', error);
            if (!(error as any).message?.includes("Teléfono requerido")) {
                toast.error("Error al agendar el turno");
            }
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateEvent = async (event: CalEvent): Promise<CalEvent> => {
        if (!canManageAppointments()) {
            toast.error("Debes tener un número de teléfono registrado para modificar turnos");
            throw new Error("Teléfono requerido");
        }

        // CORRECCIÓN: Verificar que el turno pertenezca al paciente logueado
        if ((event as any).patientId !== loggedUserId.toString()) {
            toast.error("No puedes modificar turnos de otros pacientes");
            throw new Error("No autorizado para modificar este turno");
        }

        // CORRECCIÓN: Verificar que el turno no esté confirmado
        if ((event as any).isConfirmed || (event as any).status === 'confirmed') {
            toast.error("No se puede modificar un turno confirmado");
            throw new Error("Turno confirmado no editable");
        }

        setIsProcessing(true);
        setDraggedEventId(event.id);

        const previousEvents = [...events];

        try {
            const updates = transformEventForBackend(event);

            const response = await updateAppointmentMutation.mutateAsync({
                id: event.id,
                updates: updates
            });

            if (!response.data) {
                throw new Error('No se recibieron datos del servidor');
            }

            toast.success("Turno actualizado exitosamente");

            await refetchAppointments();

            return response.data;

        } catch (error) {
            console.error('Error actualizando evento:', error);
            if (!(error as any).message?.includes("Teléfono requerido") &&
                !(error as any).message?.includes("No autorizado") &&
                !(error as any).message?.includes("Turno confirmado")) {
                toast.error("Error al actualizar el turno");
            }

            setEvents(previousEvents);

            throw error;
        } finally {
            setIsProcessing(false);
            setDraggedEventId(null);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!canManageAppointments()) {
            toast.error("Debes tener un número de teléfono registrado para eliminar turnos");
            throw new Error("Teléfono requerido");
        }

        // CORRECCIÓN: Encontrar el evento para verificar permisos
        const eventToDelete = events.find(event => event.id === eventId);
        if (!eventToDelete) {
            toast.error("Turno no encontrado");
            throw new Error("Turno no encontrado");
        }

        // CORRECCIÓN: Verificar que el turno pertenezca al paciente logueado
        if ((eventToDelete as any).patientId !== loggedUserId.toString()) {
            toast.error("No puedes eliminar turnos de otros pacientes");
            throw new Error("No autorizado para eliminar este turno");
        }

        // CORRECCIÓN: Verificar que el turno no esté confirmado
        if ((eventToDelete as any).isConfirmed || (eventToDelete as any).status === 'confirmed') {
            toast.error("No se puede eliminar un turno confirmado");
            throw new Error("Turno confirmado no eliminable");
        }

        setIsProcessing(true);
        try {
            await deleteAppointmentMutation.mutateAsync(eventId);
            toast.success("Turno eliminado exitosamente");

            await refetchAppointments();

        } catch (error) {
            console.error('Error eliminando evento:', error);
            if (!(error as any).message?.includes("Teléfono requerido") &&
                !(error as any).message?.includes("No autorizado") &&
                !(error as any).message?.includes("Turno confirmado")) {
                toast.error("Error al eliminar el turno");
            }
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEventsChange = (newEvents: CalEvent[]) => {
        if (!draggedEventId) {
            setEvents(newEvents);
        }
    };

    const handleDateChange = (newDate: Date) => {
        setCurrentDate(newDate);
    };

    const customStyles = {
        control: (provided: any) => ({
            ...provided,
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            padding: '0.25rem',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#9ca3af'
            }
        }),
        menu: (provided: any) => ({
            ...provided,
            borderRadius: '0.375rem',
            border: '1px solid #e5e7eb'
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
            color: state.isSelected ? 'white' : '#374151',
            '&:hover': {
                backgroundColor: '#f3f4f6'
            }
        })
    };

    const isLoading = isLoadingEventTypes ||
        (selectedProfessional && isLoadingSchedule) ||
        (selectedProfessional && isLoadingAppointments);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Turnos</h1>
                <p className="text-gray-600">Aquí puedes solicitar turnos</p>
            </div>

            <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4 mb-4">
                        <Settings className="text-gray-500 h-6 w-6" />
                        <div className="flex-1">
                            <p className="text-gray-800 font-medium">
                                Agenda tu turno
                            </p>
                            <p className="text-sm text-gray-500">
                                Selecciona un profesional y elige el horario que prefieras
                            </p>
                            {!hasPhone && !isLoadingUser && (
                                <p className="text-sm text-amber-600 mt-1">
                                    ⚠️ Debes agregar tu número de teléfono para poder agendar turnos
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Phone className="h-5 w-5 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">Teléfono de contacto</span>
                            </div>

                            {!isLoadingUser && (
                                <div className="flex items-center gap-3">
                                    {isEditingPhone ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="tel"
                                                value={tempPhone}
                                                onChange={(e) => setTempPhone(e.target.value)}
                                                placeholder="Ingresa tu teléfono"
                                                className="h-8 w-48 text-sm"
                                                disabled={isUpdatingPhone}
                                            />
                                            <Button
                                                size="sm"
                                                onClick={handleSaveEditPhone}
                                                disabled={isUpdatingPhone || !tempPhone.trim()}
                                                className="h-8 w-8 p-0"
                                            >
                                                {isUpdatingPhone ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Check className="h-3 w-3" />
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleCancelEditPhone}
                                                disabled={isUpdatingPhone}
                                                className="h-8 w-8 p-0"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm ${hasPhone ? 'text-gray-700' : 'text-amber-600'}`}>
                                                {hasPhone ? userPhone : 'No registrado'}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={handleStartEditPhone}
                                                className="h-6 w-6 p-0 hover:bg-gray-100"
                                                title={hasPhone ? "Editar teléfono" : "Agregar teléfono"}
                                            >
                                                <Edit3 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-7">
                            Este número será usado para confirmaciones y recordatorios de tus turnos.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Seleccione un profesional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="max-w-md">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar profesional
                        </label>
                        <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={loadProfessionals}
                            onChange={handleProfessionalChange}
                            placeholder="Escriba el nombre del profesional..."
                            noOptionsMessage={({ inputValue }) =>
                                inputValue ? "No se encontraron profesionales" : "Escriba para buscar profesionales"
                            }
                            loadingMessage={() => "Buscando..."}
                            styles={customStyles}
                            value={selectedProfessional}
                            isDisabled={isProcessing}
                        />
                    </div>

                    {selectedProfessional && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Profesional seleccionado:</strong> {selectedProfessional.label}
                            </p>
                            {isLoadingSchedule && (
                                <p className="text-xs text-blue-600 mt-1">Cargando horarios...</p>
                            )}
                            {!isLoadingSchedule && availableSlots.length > 0 && (
                                <p className="text-xs text-blue-600 mt-1">
                                    {availableSlots.length} horario(s) disponible(s) - Duración: {availableSlots[0]?.duration} minutos
                                </p>
                            )}
                            {!isLoadingAppointments && events.length > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                    {events.length} turno(s) del profesional
                                </p>
                            )}
                            {!hasPhone && !isLoadingUser && (
                                <p className="text-xs text-amber-600 mt-1">
                                    ⚠️ Agrega tu teléfono para poder gestionar turnos
                                </p>
                            )}
                            {isProcessing && (
                                <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    {draggedEventId ? "Actualizando turno..." : "Procesando turno..."}
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedProfessional && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">
                            Turnos - {selectedProfessional.label}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-gray-600 mb-4">
                            Los horarios disponibles de {selectedProfessional.label} se muestran como áreas azules en el calendario.
                            {hasPhone ? (
                                ' Haz doble click en un horario disponible para agendar un turno. Solo puedes editar tus propios turnos que no estén confirmados.'
                            ) : (
                                <span className="text-amber-600"> Agrega tu teléfono para poder agendar turnos.</span>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-lg">Cargando calendario...</div>
                            </div>
                        ) : availableSlots.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden relative">
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
                                        <div className="text-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                                            <p className="text-gray-700">
                                                {draggedEventId ? "Actualizando turno..." : "Procesando turno..."}
                                            </p>
                                            <p className="text-sm text-gray-500">Por favor espere</p>
                                        </div>
                                    </div>
                                )}

                                <SimpleCalendar
                                    events={events}
                                    eventTypes={eventTypes}
                                    availableSlots={availableSlots}
                                    onEventsChange={handleEventsChange}
                                    onSaveEvent={hasPhone ? handleSaveEvent : undefined}
                                    onUpdateEvent={hasPhone ? handleUpdateEvent : undefined}
                                    onDeleteEvent={hasPhone ? handleDeleteEvent : undefined}
                                    readOnly={isProcessing || !hasPhone}
                                    onCurrentDateChange={handleDateChange}
                                    restrictToAvailableSlots={true}
                                    restrictEventResizing={true}
                                    isLoading={isProcessing}
                                    currentUserId={loggedUserId?.toString()}
                                    userRole="patient"
                                    allowConfirmedEdits={false}
                                />
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500 border rounded-lg">
                                <p>El profesional {selectedProfessional.label} no tiene horarios configurados</p>
                                <p className="text-sm mt-2">Contacta al profesional para que configure sus horarios disponibles</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {!selectedProfessional && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-gray-500">
                            <p>👆 Selecciona un profesional para ver sus horarios disponibles</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
