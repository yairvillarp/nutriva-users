import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetAppointmentsByProfessional } from "@/hooks/appointments/use-appointments";
import { useGetScheduleProfessional, useGetEventTypes } from "@/hooks/schedule/use-schedule";
import { useUpdateAppointment, useDeleteAppointment } from "@/hooks/appointments/use-appointments";
import { Loader2, Calendar, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { CalEvent } from "@/types/appointments";
import type { AvailableSlot, EventTypeConfig } from "../googleCalendar/SimpleCalendar";
import SimpleCalendar from "../googleCalendar/SimpleCalendar";
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

export function ProfessionalAppointments() {
    const [userLogged, setUserLogged] = useState<any>(null);

    useEffect(() => {
        try {
            const userData = localStorage.getItem('data');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUserLogged(parsedUser);
                console.log('Usuario cargado:', parsedUser);
            } else {
                console.log('No se encontraron datos de usuario en localStorage');
            }
        } catch (error) {
            console.error('Error cargando datos del usuario:', error);
        }
    }, []);

    const loggedUserId = userLogged?.id;
    const professionalName = userLogged ? `${userLogged.first_name || ''} ${userLogged.last_name || ''}`.trim() : 'Profesional';

    const {
        data: appointmentsData,
        isLoading: isLoadingAppointments,
        error: appointmentsError,
        refetch: refetchAppointments
    } = useGetAppointmentsByProfessional(loggedUserId?.toString() || '');

    const {
        data: scheduleData,
        isLoading: isLoadingSchedule
    } = useGetScheduleProfessional(loggedUserId?.toString());

    const {
        data: eventTypesData,
        isLoading: isLoadingEventTypes
    } = useGetEventTypes();

    const updateAppointmentMutation = useUpdateAppointment();
    const deleteAppointmentMutation = useDeleteAppointment();

    useEffect(() => {
        if (appointmentsError) {
            toast.error("Error al cargar los turnos");
            console.error('Error cargando appointments:', appointmentsError);
        }
    }, [appointmentsError]);

    const [events, setEvents] = useState<CalEvent[]>([]);
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (eventTypesData?.data) {
            if (Array.isArray(eventTypesData.data)) {
                setEventTypes(eventTypesData.data);
            } else if (eventTypesData.data.eventTypes && Array.isArray(eventTypesData.data.eventTypes)) {
                setEventTypes(eventTypesData.data.eventTypes);
            } else {
                setEventTypes(getDefaultEventTypes());
            }
        }
    }, [eventTypesData]);

    const getDefaultEventTypes = (): EventTypeConfig[] => {
        return [
            {
                id: "consulta",
                name: "Consulta Médica",
                description: "Consulta general con el profesional",
                color: "#e3f2fd",
                textColor: "#1976d2"
            }
        ];
    };

    useEffect(() => {
        if (appointmentsData?.data && eventTypes.length > 0) {
            const calendarEvents = appointmentsData.data.map(event => {
                const patientName = (event as any).patient
                    ? `${(event as any).patient.first_name || ''} ${(event as any).patient.last_name || ''}`.trim()
                    : 'Sin paciente asignado';

                const eventTypeName = getEventTypeName((event as any).eventType);

                const eventSummary = `${patientName} - ${eventTypeName}`;

                return {
                    ...event,
                    summary: eventSummary,
                    start: {
                        dateTime: (event as any).start?.dateTime || (event as any).start,
                        timeZone: (event as any).start?.timeZone || "America/Argentina/Buenos_Aires"
                    },
                    end: {
                        dateTime: (event as any).end?.dateTime || (event as any).end,
                        timeZone: (event as any).end?.timeZone || "America/Argentina/Buenos_Aires"
                    }
                };
            });

            setEvents(calendarEvents);
        }
    }, [appointmentsData, eventTypes]);

    useEffect(() => {
        if (scheduleData?.data && loggedUserId) {
            const slots: AvailableSlot[] = scheduleData.data.map(schedule => ({
                id: `slot-${schedule.id}`,
                professionalId: loggedUserId.toString(),
                professionalName: professionalName,
                dayOfWeek: schedule.dayOfWeek,
                startTime: schedule.startTime.substring(0, 5),
                endTime: schedule.endTime.substring(0, 5),
                recurring: schedule.recurring,
                color: schedule.color || "#e3f2fd",
                borderColor: schedule.borderColor || "#bbdefb",
                note: `Horario disponible - Duración: ${schedule.duration}min`,
                duration: schedule.duration
            }));

            setAvailableSlots(slots);
        }
    }, [scheduleData, loggedUserId, professionalName]);

    const getEventTypeName = (eventType: string): string => {
        const typeConfig = eventTypes.find(et => et.id === eventType);
        return typeConfig ? typeConfig.name : eventType;
    };

    const getCurrentWeekAppointments = () => {
        const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
        const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 1 });

        return events.filter(event => {
            try {
                const eventDate = new Date(event.start.dateTime);
                return isWithinInterval(eventDate, {
                    start: startOfCurrentWeek,
                    end: endOfCurrentWeek
                });
            } catch {
                return false;
            }
        });
    };

    const getWeekRangeText = () => {
        const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
        const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 1 });

        return `${startOfCurrentWeek.toLocaleDateString('es-AR')} - ${endOfCurrentWeek.toLocaleDateString('es-AR')}`;
    };

    const handleEventsChange = (newEvents: CalEvent[]) => {
        setEvents(newEvents);
    };

    const handleDateChange = (newDate: Date) => {
        setCurrentDate(newDate);
    };

    const handleUpdateEvent = async (event: CalEvent): Promise<CalEvent> => {
        setIsProcessing(true);
        try {
            const updates = {
                summary: event.summary,
                startDateTime: event.start.dateTime,
                endDateTime: event.end.dateTime,
                eventType: event.eventType,
                email: event.email,
                status: (event as any).status || 'scheduled'
            };

            const response = await updateAppointmentMutation.mutateAsync({
                id: event.id,
                updates: updates
            });

            toast.success("Turno actualizado exitosamente");

            await refetchAppointments();

            return response.data;

        } catch (error) {
            console.error('Error actualizando turno:', error);
            toast.error("Error al actualizar el turno");
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        setIsProcessing(true);
        try {
            await deleteAppointmentMutation.mutateAsync(eventId);

            toast.success("Turno eliminado exitosamente");

            await refetchAppointments();

        } catch (error) {
            console.error('Error eliminando turno:', error);
            toast.error("Error al eliminar el turno");
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveEvent = async (event: CalEvent): Promise<CalEvent> => {
        toast.info("Los profesionales no pueden crear turnos directamente");
        return event;
    };

    const isLoading = isLoadingAppointments || isLoadingSchedule || isLoadingEventTypes || !userLogged || isProcessing;

    const currentWeekAppointments = getCurrentWeekAppointments();
    const confirmedThisWeek = currentWeekAppointments.filter(e => (e as any).status === 'confirmed').length;
    const scheduledThisWeek = currentWeekAppointments.filter(e => (e as any).status === 'scheduled').length;

    if (!userLogged && !isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <div className="text-lg">Cargando información del usuario...</div>
                </div>
            </div>
        );
    }

    if (!loggedUserId && !isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No se pudo identificar al profesional
                    </h3>
                    <p className="text-gray-500">
                        No se encontró información del usuario en el sistema.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Turnos</h1>
                <p className="text-gray-600">
                    Gestión de turnos para {professionalName}
                </p>
            </div>

            <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="flex items-center gap-4 p-4">
                    <Calendar className="text-gray-500 h-6 w-6" />
                    <div className="flex-1">
                        <p className="text-gray-800 font-medium">
                            Panel de Gestión de Turnos
                        </p>
                        <p className="text-sm text-gray-500">
                            Haz doble click en un turno para editarlo o eliminarlo
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                            <Edit className="h-4 w-4" />
                            <span>Doble click para editar</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                        Calendario de Turnos - {professionalName}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                <div className="text-lg">Cargando calendario...</div>
                            </div>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden relative">
                            {isProcessing && (
                                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
                                    <div className="text-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                                        <p className="text-gray-700">Procesando cambios...</p>
                                    </div>
                                </div>
                            )}

                            <SimpleCalendar
                                events={events}
                                eventTypes={eventTypes}
                                availableSlots={availableSlots}
                                onEventsChange={handleEventsChange}
                                onSaveEvent={handleSaveEvent}
                                onUpdateEvent={handleUpdateEvent}
                                onDeleteEvent={handleDeleteEvent}
                                readOnly={false}
                                onCurrentDateChange={handleDateChange}
                                restrictToAvailableSlots={false}
                                restrictEventResizing={false}
                                isLoading={isLoading}
                                currentUserId={loggedUserId?.toString()}
                                defaultEmail={userLogged?.email}
                                userRole="professional"
                                allowConfirmedEdits={true}
                            />
                        </div>
                    )}

                    <div className="mt-4 space-y-3">
                        {eventTypes.length > 0 && (
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">Leyenda de Turnos</h4>
                                <div className="flex flex-wrap gap-4">
                                    {eventTypes.map(eventType => (
                                        <div key={eventType.id} className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded border"
                                                style={{
                                                    backgroundColor: eventType.color,
                                                    borderColor: eventType.textColor
                                                }}
                                            />
                                            <span className="text-sm text-blue-800">{eventType.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-blue-800">
                                    📊 Estadísticas de la Semana
                                </h4>
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                    {getWeekRangeText()}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {currentWeekAppointments.length}
                                    </div>
                                    <div className="text-sm text-gray-600">Turnos Semanales</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {confirmedThisWeek}
                                    </div>
                                    <div className="text-sm text-gray-600">Confirmados</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-600">
                                        {scheduledThisWeek}
                                    </div>
                                    <div className="text-sm text-gray-600">Agendados</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {events.length}
                                    </div>
                                    <div className="text-sm text-gray-600">Total General</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
