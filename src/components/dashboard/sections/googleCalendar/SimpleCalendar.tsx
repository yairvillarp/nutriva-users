import React, { useState, useRef, useEffect } from "react";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    format,
    isSameMonth,
    isSameDay,
    startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import "./Calendar.css";

// Tipos para los eventos configurables - EXPORTAR
export type EventTypeConfig = {
    id: string;
    name: string;
    description: string;
    color: string;
    textColor: string;
};

// En SimpleCalendar.tsx
export type CalEvent = {
    id: string;
    summary: string;
    start: {
        dateTime: string;
        timeZone?: string;
    };
    end: {
        dateTime: string;
        timeZone?: string;
    };
    eventType: string;
    description?: string;
    status?: string;
    isConfirmed?: boolean;
    patientId?: string;
    professionalId?: string;
    patient?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
    };
};

export type AvailableSlot = {
    id: string;
    professionalId: string;
    professionalName: string;
    dayOfWeek?: number;
    date?: string;
    startTime: string;
    endTime: string;
    recurring: boolean;
    color: string;
    borderColor: string;
    note?: string;
    duration?: number;
};

type SaveEventFunction = (event: CalEvent) => Promise<CalEvent>;
type UpdateEventFunction = (event: CalEvent) => Promise<CalEvent>;
type DeleteEventFunction = (eventId: string) => Promise<void>;

type Props = {
    events: CalEvent[];
    eventTypes: EventTypeConfig[];
    availableSlots?: AvailableSlot[];
    onEventsChange?: (events: CalEvent[]) => void;
    onSaveEvent?: SaveEventFunction;
    onUpdateEvent?: UpdateEventFunction;
    onDeleteEvent?: DeleteEventFunction;
    readOnly?: boolean;
    onCurrentDateChange?: (date: Date) => void;
    restrictToAvailableSlots?: boolean;
    restrictEventResizing?: boolean;
    isLoading?: boolean;
    currentUserId?: string;
    userRole?: 'patient' | 'professional' | 'admin';
    allowConfirmedEdits?: boolean;
};

type ResizeState = {
    id: string;
    view: "month" | "week" | "day";
    startX: number;
    startY: number;
    initialStart: Date;
    initialEnd: Date;
    eventEl?: HTMLElement | null;
    containerRect?: DOMRect | null;
    contextDay?: Date | null;
};

const HOUR_PX = 40;

const SimpleCalendar: React.FC<Props> = ({
    events,
    eventTypes,
    availableSlots = [],
    onEventsChange,
    onSaveEvent,
    onUpdateEvent,
    onDeleteEvent,
    readOnly = false,
    onCurrentDateChange,
    restrictToAvailableSlots = false,
    restrictEventResizing = false,
    isLoading = false,
    currentUserId,
    userRole = 'patient',
    allowConfirmedEdits = false
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<"month" | "week" | "day">("week");
    const [localEvents, setLocalEvents] = useState<CalEvent[]>(events);

    const eventTypeIds = eventTypes.map(et => et.id);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragPreview, setDragPreview] = useState<{ x: number; y: number; text: string } | null>(null);

    const [resizingId, setResizingId] = useState<string | null>(null);
    const resizeState = useRef<ResizeState | null>(null);

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; date: Date } | null>(null);
    const [eventMenu, setEventMenu] = useState<{ x: number; y: number; event: CalEvent } | null>(null);
    const [newType, setNewType] = useState(eventTypeIds[0]);
    const [isLoadingEvent, setIsLoadingEvent] = useState<string | null>(null);
    const [creationError, setCreationError] = useState<string | null>(null);

    // Estado para touch en móvil
    const [isMobile, setIsMobile] = useState(false);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const eventMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    useEffect(() => {
        setLocalEvents(events);
    }, [events]);

    useEffect(() => {
        onCurrentDateChange?.(currentDate);
    }, [currentDate, onCurrentDateChange]);

    // Cerrar menús al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
            if (eventMenuRef.current && !eventMenuRef.current.contains(e.target as Node)) {
                setEventMenu(null);
            }
        };

        const handleTouchOutside = (e: TouchEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
            if (eventMenuRef.current && !eventMenuRef.current.contains(e.target as Node)) {
                setEventMenu(null);
            }
        };

        if (contextMenu || eventMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleTouchOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleTouchOutside);
        };
    }, [contextMenu, eventMenu]);

    const parsePostgresDate = (dateString: string): Date => {
        if (!dateString || typeof dateString !== 'string') {
            console.error('Fecha inválida recibida:', dateString);
            return new Date();
        }

        try {
            const datePart = dateString.substring(0, 10);
            const timePart = dateString.substring(11, 19);
            const offsetPart = dateString.substring(24, 29);

            const isoString = `${datePart}T${timePart}${offsetPart.substring(0, 3)}:${offsetPart.substring(3)}`;
            const result = new Date(isoString);

            if (isNaN(result.getTime())) {
                console.error('Fecha inválida después de parseo:', dateString);
                return new Date();
            }

            return result;
        } catch (error) {
            console.error('Error crítico parsing date:', dateString, error);
            return new Date();
        }
    };

    const formatToPostgresDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        const timezoneOffset = -date.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
        const offsetMinutes = Math.abs(timezoneOffset) % 60;
        const offsetSign = timezoneOffset >= 0 ? '+' : '-';
        const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}${String(offsetMinutes).padStart(2, '0')}`;

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.000 ${offsetString}`;
    };

    const getEventTypeConfig = (eventTypeId: string): EventTypeConfig => {
        return eventTypes.find(et => et.id === eventTypeId) || eventTypes[0];
    };

    const generateEventStyles = () => {
        return eventTypes.map(eventType => `
            .event-item.${eventType.id} {
                background: ${eventType.color} !important;
                color: ${eventType.textColor} !important;
                border-left: 3px solid ${eventType.color};
            }
            
            .event-item.${eventType.id}.dragging {
                background: ${eventType.color} !important;
                opacity: 0.7;
            }
            
            .event-item.${eventType.id}.confirmed {
                border-left: 3px solid #4CAF50 !important;
                background: linear-gradient(90deg, ${eventType.color} 0%, ${eventType.color} 95%, #4CAF50 95%) !important;
            }
        `).join('\n');
    };

    const getAvailableSlotsForDate = (date: Date, slots: AvailableSlot[]): AvailableSlot[] => {
        const dayOfWeek = date.getDay();
        const dateString = format(date, 'yyyy-MM-dd');

        return slots.filter(slot => {
            if (slot.recurring) {
                return slot.dayOfWeek === dayOfWeek;
            } else {
                return slot.date === dateString;
            }
        });
    };

    // NUEVA FUNCIÓN: Encontrar el slot que coincide con la hora específica
    const getMatchingSlot = (date: Date, slots: AvailableSlot[]): AvailableSlot | null => {
        const targetMinutes = date.getHours() * 60 + date.getMinutes();

        // Primero buscar slots que contengan exactamente esta hora
        const containingSlot = slots.find(slot => {
            const slotStartMinutes = timeToMinutes(slot.startTime);
            const slotEndMinutes = timeToMinutes(slot.endTime);
            return targetMinutes >= slotStartMinutes && targetMinutes < slotEndMinutes;
        });

        if (containingSlot) return containingSlot;

        // Si no hay slot que contenga la hora, buscar el primero disponible
        if (slots.length > 0) return slots[0];

        return null;
    };

    const timeToMinutes = (timeString: string): number => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const calculateSlotPosition = (slot: AvailableSlot) => {
        const startMinutes = timeToMinutes(slot.startTime);
        const endMinutes = timeToMinutes(slot.endTime);
        const durationMinutes = endMinutes - startMinutes;

        const top = (startMinutes / 60) * HOUR_PX;
        const height = (durationMinutes / 60) * HOUR_PX;

        return { top, height };
    };

    const getSlotDuration = (slot: AvailableSlot): number => {
        // Priorizar la duración explícita del slot
        if (slot.duration && slot.duration > 0) return slot.duration;

        // Calcular duración basada en startTime y endTime
        const startMinutes = timeToMinutes(slot.startTime);
        const endMinutes = timeToMinutes(slot.endTime);
        const calculatedDuration = endMinutes - startMinutes;

        // Si la duración calculada es inválida, usar 60 minutos por defecto
        return calculatedDuration > 0 ? calculatedDuration : 60;
    };

    const hasEventOverlap = (newStart: Date, newEnd: Date, existingEvents: CalEvent[], excludeEventId?: string): boolean => {
        return existingEvents.some(event => {
            if (excludeEventId && event.id === excludeEventId) return false;

            const existingStart = parseDate(event.start.dateTime);
            const existingEnd = parseDate(event.end.dateTime);

            return (
                (newStart < existingEnd && newEnd > existingStart) ||
                (newStart.getTime() === existingStart.getTime() && newEnd.getTime() === existingEnd.getTime())
            );
        });
    };

    const isTimeInAvailableSlot = (date: Date): boolean => {
        if (!restrictToAvailableSlots || availableSlots.length === 0) return true;

        const targetDate = new Date(date);
        const targetDayOfWeek = targetDate.getDay();
        const targetDateString = format(targetDate, 'yyyy-MM-dd');
        const targetMinutes = targetDate.getHours() * 60 + targetDate.getMinutes();

        const matchingSlots = availableSlots.filter(slot => {
            if (slot.recurring) return slot.dayOfWeek === targetDayOfWeek;
            return slot.date === targetDateString;
        });

        return matchingSlots.some(slot => {
            const slotStartMinutes = timeToMinutes(slot.startTime);
            const slotEndMinutes = timeToMinutes(slot.endTime);
            return targetMinutes >= slotStartMinutes && targetMinutes < slotEndMinutes;
        });
    };

    const parseDate = (val: string) => parsePostgresDate(val);

    const goPrev = () => {
        if (view === "month") setCurrentDate((d) => subMonths(d, 1));
        else if (view === "week") setCurrentDate((d) => addDays(d, -7));
        else setCurrentDate((d) => addDays(d, -1));
    };

    const goNext = () => {
        if (view === "month") setCurrentDate((d) => addMonths(d, 1));
        else if (view === "week") setCurrentDate((d) => addDays(d, 7));
        else setCurrentDate((d) => addDays(d, 1));
    };

    const updateEvents = (updatedEvents: CalEvent[]) => {
        setLocalEvents(updatedEvents);
        onEventsChange?.(updatedEvents);
    };

    const handleSaveEvent = async (event: CalEvent): Promise<CalEvent> => {
        if (onSaveEvent) {
            setIsLoadingEvent(event.id);
            try {
                const savedEvent = await onSaveEvent(event);
                const updatedEvents = localEvents.map(ev =>
                    ev.id === event.id ? savedEvent : ev
                );
                updateEvents(updatedEvents);
                return savedEvent;
            } catch (error) {
                console.error("Error saving event:", error);
                throw error;
            } finally {
                setIsLoadingEvent(null);
            }
        }
        return event;
    };

    const handleUpdateEvent = async (event: CalEvent): Promise<CalEvent> => {
        if (onUpdateEvent) {
            setIsLoadingEvent(event.id);
            try {
                const updatedEvent = await onUpdateEvent(event);
                const updatedEvents = localEvents.map(ev =>
                    ev.id === event.id ? updatedEvent : ev
                );
                updateEvents(updatedEvents);
                return updatedEvent;
            } catch (error) {
                console.error("Error updating event:", error);
                throw error;
            } finally {
                setIsLoadingEvent(null);
            }
        }
        return event;
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (onDeleteEvent) {
            setIsLoadingEvent(eventId);
            try {
                await onDeleteEvent(eventId);
                const updatedEvents = localEvents.filter(ev => ev.id !== eventId);
                updateEvents(updatedEvents);
            } catch (error) {
                console.error("Error deleting event:", error);
                throw error;
            } finally {
                setIsLoadingEvent(null);
            }
        } else {
            const updatedEvents = localEvents.filter(ev => ev.id !== eventId);
            updateEvents(updatedEvents);
        }
    };

    // Handler simplificado para touch en móvil
    const handleMobileTap = (e: React.TouchEvent, date: Date, isTimeSlot: boolean = false) => {
        if (readOnly) return;
        const touch = e.touches[0];
        let target: Date;
        if (isTimeSlot) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const y = touch.clientY - rect.top;
            const hourHeight = rect.height / 24;
            const hour = y / hourHeight;
            const hoursPart = Math.floor(hour);
            const minutesPart = Math.round((hour - hoursPart) * 60 / 15) * 15;
            target = new Date(date);
            target.setHours(hoursPart, minutesPart, 0, 0);
        } else {
            target = startOfDay(date);
        }
        if (restrictToAvailableSlots && !isTimeInAvailableSlot(target)) {
            setCreationError("No se puede crear el evento fuera de los horarios disponibles");
            setTimeout(() => setCreationError(null), 3000);
            return;
        }
        setContextMenu({
            x: touch.clientX,
            y: touch.clientY,
            date: target
        });
    };

    // Handler para doble click en eventos (para editar/eliminar)
    const handleEventDoubleClick = (e: React.MouseEvent, event: CalEvent) => {
        if (readOnly) return;
        const isConfirmed = event.isConfirmed || event.status === 'confirmed';
        const canEditEvent = !readOnly &&
            (!isConfirmed || allowConfirmedEdits) &&
            (!currentUserId || !event.patientId || event.patientId === currentUserId || userRole === 'professional' || userRole === 'admin');
        if (!canEditEvent) return;
        e.stopPropagation();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = 200;
        const menuHeight = 250;
        let x = e.clientX;
        let y = e.clientY;
        if (x + menuWidth > viewportWidth) x = viewportWidth - menuWidth - 10;
        if (y + menuHeight > viewportHeight) y = viewportHeight - menuHeight - 10;
        setEventMenu({ x, y, event });
    };

    // Handler para doble click en días/horarios
    const handleDayDoubleClick = (e: React.MouseEvent, date: Date, isTimeSlot: boolean = false) => {
        if (readOnly) return;
        let target: Date;
        if (isTimeSlot) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const y = e.clientY - rect.top;
            const hourHeight = rect.height / 24;
            const hour = y / hourHeight;
            const hoursPart = Math.floor(hour);
            const minutesPart = Math.round((hour - hoursPart) * 60 / 15) * 15;
            target = new Date(date);
            target.setHours(hoursPart, minutesPart, 0, 0);
        } else {
            target = startOfDay(date);
        }
        if (restrictToAvailableSlots && !isTimeInAvailableSlot(target)) {
            setCreationError("No se puede crear el evento fuera de los horarios disponibles");
            setTimeout(() => setCreationError(null), 3000);
            return;
        }
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = 200;
        const menuHeight = 250;
        let x = e.clientX;
        let y = e.clientY;
        if (x + menuWidth > viewportWidth) x = viewportWidth - menuWidth - 10;
        if (y + menuHeight > viewportHeight) y = viewportHeight - menuHeight - 10;
        setContextMenu({ x, y, date: target });
    };

    const onEventDragStart = (e: React.DragEvent, ev: CalEvent) => {
        const isConfirmed = ev.isConfirmed || ev.status === 'confirmed';
        const canEditEvent = !readOnly &&
            (!isConfirmed || allowConfirmedEdits) &&
            (!currentUserId || !ev.patientId || ev.patientId === currentUserId || userRole === 'professional' || userRole === 'admin');
        if (!canEditEvent || resizingId) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("text/plain", ev.id);
        e.dataTransfer.effectAllowed = "move";
        setDraggingId(ev.id);
        setDragPreview({ x: e.clientX + 8, y: e.clientY + 8, text: ev.summary });
        const img = document.createElement("div");
        img.style.width = "0px";
        img.style.height = "0px";
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const onEventDragEnd = () => {
        setDraggingId(null);
        setDragPreview(null);
        document.querySelectorAll('.week-day-column.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    };

    useEffect(() => {
        const onDragOver = (e: DragEvent) => {
            if (!draggingId) return;
            e.preventDefault();
            setDragPreview((p) => (p ? { ...p, x: e.clientX + 8, y: e.clientY + 8 } : { x: e.clientX + 8, y: e.clientY + 8, text: "" }));
        };
        const onDragEnd = () => {
            setDraggingId(null);
            setDragPreview(null);
            document.querySelectorAll('.week-day-column.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
        };
        window.addEventListener("dragover", onDragOver);
        window.addEventListener("dragend", onDragEnd);
        return () => {
            window.removeEventListener("dragover", onDragOver);
            window.removeEventListener("dragend", onDragEnd);
        };
    }, [draggingId]);

    const handleDrop = async (id: string, targetDate: Date, dropY?: number) => {
        const eventToUpdate = localEvents.find(ev => ev.id === id);
        if (!eventToUpdate) return;
        const isConfirmed = eventToUpdate.isConfirmed || eventToUpdate.status === 'confirmed';
        const canEditEvent = !readOnly &&
            (!isConfirmed || allowConfirmedEdits) &&
            (!currentUserId || !eventToUpdate.patientId || eventToUpdate.patientId === currentUserId || userRole === 'professional' || userRole === 'admin');
        if (!canEditEvent) return;
        setDraggingId(null);
        setDragPreview(null);
        const oldStart = parseDate(eventToUpdate.start.dateTime);
        const oldEnd = parseDate(eventToUpdate.end.dateTime);
        const duration = oldEnd.getTime() - oldStart.getTime();
        let newStart: Date;
        if (dropY !== undefined && dropY < 40) {
            newStart = new Date(targetDate);
            newStart.setHours(0, 0, 0, 0);
        } else {
            newStart = new Date(targetDate);
            const safeDropY = Math.max(0, dropY || 0);
            if (dropY !== undefined && (view === "week" || view === "day")) {
                const hourHeight = (24 * HOUR_PX) / 24;
                const hour = safeDropY / hourHeight;
                const hoursPart = Math.floor(hour);
                const minutesPart = Math.round((hour - hoursPart) * 60 / 15) * 15;
                newStart.setHours(hoursPart, minutesPart, 0, 0);
            }
        }
        if (restrictToAvailableSlots && !isTimeInAvailableSlot(newStart)) {
            setCreationError("No se puede crear el evento fuera de los horarios disponibles");
            setTimeout(() => setCreationError(null), 3000);
            return;
        }
        const newEnd = new Date(newStart.getTime() + duration);
        const dayEvents = getDayEvents(newStart);
        if (hasEventOverlap(newStart, newEnd, dayEvents, id)) {
            setCreationError("No se puede mover el evento porque se superpone con otro turno existente");
            setTimeout(() => setCreationError(null), 3000);
            return;
        }
        const updatedEvent = {
            ...eventToUpdate,
            start: { dateTime: formatToPostgresDate(newStart) },
            end: { dateTime: formatToPostgresDate(newEnd) },
        };
        const updatedEvents = localEvents.map(ev =>
            ev.id === id ? updatedEvent : ev
        );
        updateEvents(updatedEvents);
        if (onUpdateEvent) {
            try {
                await handleUpdateEvent(updatedEvent);
            } catch (error) {
                updateEvents(localEvents);
                console.error("Error updating event after drag:", error);
            }
        }
    };

    const startResize = (event: CalEvent, e: React.MouseEvent, contextDay?: Date) => {
        const isConfirmed = event.isConfirmed || event.status === 'confirmed';
        const canEditEvent = !readOnly &&
            (!isConfirmed || allowConfirmedEdits) &&
            (!currentUserId || !event.patientId || event.patientId === currentUserId || userRole === 'professional' || userRole === 'admin');
        if (!canEditEvent || restrictEventResizing) return;
        e.preventDefault();
        e.stopPropagation();
        setResizingId(event.id);
        const handleEl = e.currentTarget as HTMLElement;
        const eventEl = handleEl.closest(".event-item") as HTMLElement | null;
        if (eventEl) eventEl.setAttribute("draggable", "false");
        let containerRect: DOMRect | null = null;
        if (view === "week") {
            const col = eventEl?.closest(".week-day-column") as HTMLElement | null;
            const slots = col ? (col.querySelector(".time-slots") as HTMLElement | null) : null;
            containerRect = slots ? slots.getBoundingClientRect() : null;
        } else if (view === "day") {
            const dv = eventEl?.closest(".day-events") as HTMLElement | null;
            containerRect = dv ? dv.getBoundingClientRect() : null;
        } else {
            const grid = document.querySelector(".calendar-grid") as HTMLElement | null;
            containerRect = grid ? grid.getBoundingClientRect() : null;
        }
        resizeState.current = {
            id: event.id,
            view,
            startX: e.clientX,
            startY: e.clientY,
            initialStart: parseDate(event.start.dateTime),
            initialEnd: parseDate(event.end.dateTime),
            eventEl,
            containerRect,
            contextDay: contextDay || null,
        };
        document.body.style.userSelect = "none";
        document.body.style.cursor = view === "month" ? "ew-resize" : "ns-resize";
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!resizingId || !resizeState.current || readOnly || restrictEventResizing) return;
        const st = resizeState.current;
        if (st.view === "week" || st.view === "day") {
            if (!st.containerRect) return;
            const y = e.clientY - st.containerRect.top;
            const clamped = Math.max(0, Math.min(y, st.containerRect.height));
            const minutes = Math.round(((clamped / st.containerRect.height) * 24 * 60) / 15) * 15;
            const baseDay = st.contextDay ? new Date(st.contextDay) : new Date(st.initialStart);
            baseDay.setHours(0, 0, 0, 0);
            const newEnd = new Date(baseDay);
            newEnd.setMinutes(minutes);
            const minEnd = new Date(st.initialStart.getTime() + 15 * 60 * 1000);
            if (newEnd.getTime() <= st.initialStart.getTime()) newEnd.setTime(minEnd.getTime());
            const updatedEvents = localEvents.map((ev) =>
                ev.id === st.id ? { ...ev, end: { dateTime: formatToPostgresDate(newEnd) } } : ev
            );
            updateEvents(updatedEvents);
            return;
        }
        if (st.view === "month") {
            const deltaX = e.clientX - st.startX;
            const pixelsPerDay = 100;
            const daysDelta = Math.round(deltaX / pixelsPerDay);
            const candidate = new Date(st.initialEnd);
            candidate.setDate(st.initialEnd.getDate() + daysDelta);
            const minEnd = new Date(st.initialStart);
            minEnd.setDate(minEnd.getDate() + 1);
            if (candidate.getTime() <= minEnd.getTime()) candidate.setTime(minEnd.getTime());
            const updatedEvents = localEvents.map((ev) =>
                ev.id === st.id ? { ...ev, end: { dateTime: formatToPostgresDate(candidate) } } : ev
            );
            updateEvents(updatedEvents);
            return;
        }
    };

    const finishResize = async () => {
        if (resizeState.current && onUpdateEvent && !readOnly && !restrictEventResizing) {
            const eventId = resizeState.current.id;
            const updatedEvent = localEvents.find(ev => ev.id === eventId);
            if (updatedEvent) {
                const newStart = parseDate(updatedEvent.start.dateTime);
                const newEnd = parseDate(updatedEvent.end.dateTime);
                const dayEvents = getDayEvents(newStart);
                if (hasEventOverlap(newStart, newEnd, dayEvents, eventId)) {
                    setCreationError("No se puede redimensionar el evento porque se superpone con otro turno existente");
                    setTimeout(() => setCreationError(null), 3000);
                    const originalEvent = events.find(ev => ev.id === eventId);
                    if (originalEvent) {
                        const revertedEvents = localEvents.map(ev =>
                            ev.id === eventId ? originalEvent : ev
                        );
                        updateEvents(revertedEvents);
                    }
                    if (resizeState.current?.eventEl) {
                        try {
                            resizeState.current.eventEl.setAttribute("draggable", "true");
                        } catch { }
                    }
                    setResizingId(null);
                    resizeState.current = null;
                    document.body.style.userSelect = "";
                    document.body.style.cursor = "";
                    return;
                }
                try {
                    await handleUpdateEvent(updatedEvent);
                } catch (error) {
                    console.error("Error updating event after resize:", error);
                }
            }
        }
        if (resizeState.current?.eventEl) {
            try {
                resizeState.current.eventEl.setAttribute("draggable", "true");
            } catch { }
        }
        setResizingId(null);
        resizeState.current = null;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
    };

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", finishResize);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", finishResize);
        };
    }, [resizingId, localEvents, readOnly]);

    const getDayEvents = (day: Date) => localEvents.filter((event) =>
        isSameDay(parseDate(event.start.dateTime), day)
    );

    const handleCreateEvent = async (date: Date, eventTypeId: string) => {
        if (readOnly) return;
        if (restrictToAvailableSlots && !isTimeInAvailableSlot(date)) {
            setCreationError("No se puede crear el evento fuera de los horarios disponibles");
            setTimeout(() => setCreationError(null), 4000);
            return;
        }
        const eventType = getEventTypeConfig(eventTypeId);
        const start = new Date(date);
        let duration = 60 * 60 * 1000;
        if (restrictToAvailableSlots && availableSlots.length > 0) {
            const availableSlotsForDate = getAvailableSlotsForDate(date, availableSlots);
            if (availableSlotsForDate.length > 0) {
                const matchingSlot = getMatchingSlot(date, availableSlotsForDate);
                if (matchingSlot) {
                    const slotDuration = getSlotDuration(matchingSlot);
                    duration = slotDuration * 60 * 1000;
                }
            }
        }
        const end = new Date(start.getTime() + duration);
        if (restrictToAvailableSlots) {
            const availableSlotsForDate = getAvailableSlotsForDate(date, availableSlots);
            if (availableSlotsForDate.length > 0) {
                const matchingSlot = getMatchingSlot(date, availableSlotsForDate);
                if (matchingSlot) {
                    const slotEndMinutes = timeToMinutes(matchingSlot.endTime);
                    const slotEndDate = new Date(date);
                    slotEndDate.setHours(Math.floor(slotEndMinutes / 60), slotEndMinutes % 60, 0, 0);
                    if (end.getTime() > slotEndDate.getTime()) {
                        const maxDuration = slotEndDate.getTime() - start.getTime();
                        if (maxDuration > 0) {
                            duration = maxDuration;
                            end.setTime(start.getTime() + duration);
                        } else {
                            setCreationError("No hay tiempo suficiente en este horario para el turno");
                            setTimeout(() => setCreationError(null), 3000);
                            return;
                        }
                    }
                }
            }
        }
        const dayEvents = getDayEvents(start);
        if (hasEventOverlap(start, end, dayEvents)) {
            setCreationError("No se puede crear el evento porque se superpone con otro turno existente");
            setTimeout(() => setCreationError(null), 3000);
            return;
        }
        const newEvent: CalEvent = {
            id: `temp-${Date.now()}`,
            summary: `${eventType.name} nuevo`,
            start: { dateTime: formatToPostgresDate(start) },
            end: { dateTime: formatToPostgresDate(end) },
            eventType: eventTypeId,
        };
        const updatedEvents = [...localEvents, newEvent];
        updateEvents(updatedEvents);
        if (onSaveEvent) {
            try {
                await handleSaveEvent(newEvent);
            } catch (error) {
                updateEvents(localEvents.filter(ev => ev.id !== newEvent.id));
                console.error("Error creating event:", error);
            }
        }
    };

    const handleEventUpdate = async (eventId: string, updates: Partial<CalEvent>) => {
        if (readOnly) return;
        const updatedEvents = localEvents.map(ev =>
            ev.id === eventId ? { ...ev, ...updates } : ev
        );
        updateEvents(updatedEvents);
        if (onUpdateEvent) {
            const updatedEvent = updatedEvents.find(ev => ev.id === eventId);
            if (updatedEvent) {
                try {
                    await handleUpdateEvent(updatedEvent);
                } catch (error) {
                    console.error("Error updating event:", error);
                }
            }
        }
    };

    const renderAvailableSlotsWeek = (day: Date) => {
        if (!availableSlots || availableSlots.length === 0) return null;
        const daySlots = getAvailableSlotsForDate(day, availableSlots);
        return daySlots.map((slot) => {
            const { top, height } = calculateSlotPosition(slot);
            return (
                <div
                    key={`available-${slot.id}-${day.toISOString()}`}
                    className="available-slot"
                    style={{
                        position: "absolute",
                        top: Math.max(0, top),
                        height,
                        left: "4px",
                        right: "4px",
                        backgroundColor: slot.color,
                        border: `1px dashed ${slot.borderColor}`,
                        borderRadius: "4px",
                        opacity: 0.7,
                        zIndex: 0,
                        pointerEvents: "none"
                    }}
                    title={`${slot.professionalName}: ${slot.startTime} - ${slot.endTime}`}
                />
            );
        });
    };

    const renderAvailableSlotsDay = (day: Date) => {
        if (!availableSlots || availableSlots.length === 0) return null;
        const daySlots = getAvailableSlotsForDate(day, availableSlots);
        return daySlots.map((slot) => {
            const { top, height } = calculateSlotPosition(slot);
            return (
                <div
                    key={`available-${slot.id}-${day.toISOString()}`}
                    className="available-slot"
                    style={{
                        position: "absolute",
                        top: Math.max(0, top),
                        height,
                        left: "8px",
                        right: "8px",
                        backgroundColor: slot.color,
                        border: `1px dashed ${slot.borderColor}`,
                        borderRadius: "4px",
                        opacity: 0.7,
                        zIndex: 0,
                        pointerEvents: "none"
                    }}
                    title={`${slot.professionalName}: ${slot.startTime} - ${slot.endTime}`}
                />
            );
        });
    };

    const renderEventItem = (event: CalEvent, day?: Date, isMonthView: boolean = false) => {
        const start = parseDate(event.start.dateTime);
        const end = parseDate(event.end.dateTime);
        const isConfirmed = event.isConfirmed || event.status === 'confirmed';
        const canEditEvent = !readOnly &&
            (!isConfirmed || allowConfirmedEdits) &&
            (!currentUserId || !event.patientId || event.patientId === currentUserId || userRole === 'professional' || userRole === 'admin');
        const eventWithPatient = event as any;
        const hasPatient = eventWithPatient.patient &&
            (eventWithPatient.patient.first_name || eventWithPatient.patient.last_name);
        const patientName = hasPatient
            ? `${eventWithPatient.patient.first_name || ''} ${eventWithPatient.patient.last_name || ''}`.trim()
            : 'Sin paciente';
        const eventTypeName = getEventTypeConfig(event.eventType).name;
        const eventClasses = `event-item ${event.eventType} ${draggingId === event.id ? "dragging" : ""} ${isConfirmed ? "confirmed" : ""} ${!canEditEvent ? "read-only" : ""}`;

        if (isMonthView) {
            return (
                <div
                    key={event.id}
                    className={eventClasses}
                    draggable={canEditEvent && resizingId !== event.id}
                    onDragStart={(e) => canEditEvent && onEventDragStart(e, event)}
                    onDragEnd={onEventDragEnd}
                    onDoubleClick={(e) => handleEventDoubleClick(e, event)}
                >
                    {isConfirmed && <div className="confirmed-badge" title="Turno confirmado">✓</div>}
                    <div className="event-time" style={{ fontSize: '10px', marginBottom: '3px', opacity: 0.9 }}>
                        {format(start, "HH:mm")} - {format(end, "HH:mm")}
                    </div>
                    <div className="event-title" style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.2', marginBottom: '2px' }}>
                        {patientName}
                    </div>
                    {canEditEvent && !restrictEventResizing && (
                        <div className="resize-handle" onMouseDown={(ev) => startResize(event, ev as any, day)} />
                    )}
                </div>
            );
        }

        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const endMinutes = end.getHours() * 60 + end.getMinutes();
        const top = (startMinutes / 60) * HOUR_PX;
        const durationHours = (endMinutes - startMinutes) / 60;
        const height = Math.max((15 / 60) * HOUR_PX, durationHours * HOUR_PX);

        return (
            <div
                key={event.id}
                className={eventClasses}
                draggable={canEditEvent && resizingId !== event.id}
                onDragStart={(e) => canEditEvent && onEventDragStart(e, event)}
                onDragEnd={onEventDragEnd}
                onDoubleClick={(e) => handleEventDoubleClick(e, event)}
                style={{
                    position: "absolute",
                    top: Math.max(0, top),
                    height,
                    left: "2px",
                    right: "2px",
                    zIndex: draggingId === event.id ? 1000 : 1,
                    padding: '4px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start'
                }}
            >
                {isConfirmed && <div className="confirmed-badge" title="Turno confirmado">✓</div>}
                <div className="event-title" style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.2', marginBottom: height > 45 ? '3px' : '1px', flexShrink: 0 }}>
                    {patientName}
                </div>
                <div className="event-type" style={{ fontSize: '11px', opacity: 0.8, lineHeight: '1.1', fontStyle: 'italic', flexShrink: 0 }}>
                    {eventTypeName}
                </div>
                {canEditEvent && !restrictEventResizing && (
                    <div className="resize-handle" onMouseDown={(ev) => startResize(event, ev as any, day)} />
                )}
            </div>
        );
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const rows: React.ReactNode[] = [];
        let days: React.ReactNode[] = [];
        let day = startDate;
        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const dayEvents = getDayEvents(cloneDay);
                days.push(
                    <div
                        className={`calendar-day ${!isSameMonth(cloneDay, monthStart) ? "empty" : ""} ${isSameDay(cloneDay, new Date()) ? "today" : ""}`}
                        key={cloneDay.toISOString()}
                        onDoubleClick={(e) => handleDayDoubleClick(e, cloneDay, false)}
                        onTouchStart={(e) => !readOnly && handleMobileTap(e, cloneDay, false)}
                        onDragOver={(e) => !readOnly && e.preventDefault()}
                        onDrop={(e) => {
                            if (readOnly) return;
                            e.preventDefault();
                            const id = e.dataTransfer.getData("text/plain");
                            if (!id) return;
                            handleDrop(id, cloneDay);
                        }}
                    >
                        <div className="day-number">{format(cloneDay, "d", { locale: es })}</div>
                        <div className="events">
                            {dayEvents.map((event) => renderEventItem(event, startOfDay(cloneDay), true))}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(<div className="calendar-days" key={day.toISOString()}>{days}</div>);
            days = [];
        }
        return (
            <div className="calendar-grid month-view">
                <div className="week-days">{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (<div className="week-day" key={d}>{d}</div>))}</div>
                {rows}
            </div>
        );
    };

    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
        const hours = Array.from({ length: 24 }).map((_, i) => i);
        return (
            <div className="week-view-container">
                <div className="week-view">
                    <div className="time-column">
                        <div className="week-day-header" style={{ visibility: "hidden" }} />
                        {hours.map((h) => (<div key={h} className="time-label">{`${h}:00`}</div>))}
                    </div>
                    {days.map((day) => (
                        <div
                            className="week-day-column"
                            key={day.toISOString()}
                            onDoubleClick={(e) => {
                                if (readOnly) return;
                                const col = e.currentTarget as HTMLElement;
                                const slots = col.querySelector(".time-slots") as HTMLElement | null;
                                if (!slots) return;
                                handleDayDoubleClick(e, day, true);
                            }}
                            onTouchStart={(e) => !readOnly && handleMobileTap(e, day, true)}
                            onDragOver={(e) => {
                                if (!readOnly) {
                                    e.preventDefault();
                                    const col = e.currentTarget as HTMLElement;
                                    const rect = col.getBoundingClientRect();
                                    const y = e.clientY - rect.top;
                                    if (y < 40) col.classList.add('drag-over');
                                    else col.classList.remove('drag-over');
                                }
                            }}
                            onDragLeave={(e) => (e.currentTarget as HTMLElement).classList.remove('drag-over')}
                            onDrop={(e) => {
                                if (readOnly) return;
                                e.preventDefault();
                                const id = e.dataTransfer.getData("text/plain");
                                if (!id) return;
                                const col = e.currentTarget as HTMLElement;
                                const slots = col.querySelector(".time-slots") as HTMLElement | null;
                                const rect = slots ? slots.getBoundingClientRect() : col.getBoundingClientRect();
                                const y = e.clientY - rect.top;
                                let targetDate = new Date(day);
                                if (y < 40) {
                                    targetDate.setHours(0, 0, 0, 0);
                                    handleDrop(id, targetDate, y);
                                } else {
                                    const hourHeight = rect.height / 24;
                                    const hour = (y - 40) / hourHeight;
                                    const hoursPart = Math.floor(hour);
                                    const minutesPart = Math.round((hour - hoursPart) * 60 / 15) * 15;
                                    targetDate.setHours(hoursPart, minutesPart, 0, 0);
                                    handleDrop(id, targetDate, y);
                                }
                                col.classList.remove('drag-over');
                            }}
                        >
                            <div className={`week-day-header ${isSameDay(day, new Date()) ? "today" : ""}`}>
                                {format(day, "EEE d", { locale: es })}
                            </div>
                            <div className="time-slots">
                                {hours.map((hour) => (<div key={hour} className="time-slot" />))}
                                {renderAvailableSlotsWeek(day)}
                                {getDayEvents(day).map((event) => renderEventItem(event, day))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const hours = Array.from({ length: 24 }).map((_, i) => i);
        const dayEvents = getDayEvents(currentDate);
        return (
            <div className="day-view-container">
                <div className="day-view">
                    <div className="time-column">
                        {hours.map((hour) => (<div key={hour} className="time-label">{`${hour}:00`}</div>))}
                    </div>
                    <div
                        className="day-events"
                        onDoubleClick={(e) => {
                            if (readOnly) return;
                            handleDayDoubleClick(e, currentDate, true);
                        }}
                        onTouchStart={(e) => !readOnly && handleMobileTap(e, currentDate, true)}
                        onDragOver={(e) => !readOnly && e.preventDefault()}
                        onDrop={(e) => {
                            if (readOnly) return;
                            e.preventDefault();
                            const id = e.dataTransfer.getData("text/plain");
                            if (!id) return;
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            const y = e.clientY - rect.top;
                            const hourHeight = rect.height / 24;
                            const hour = y / hourHeight;
                            const hoursPart = Math.floor(hour);
                            const minutesPart = Math.round((hour - hoursPart) * 60 / 15) * 15;
                            const newDate = new Date(currentDate);
                            newDate.setHours(hoursPart, minutesPart, 0, 0);
                            handleDrop(id, newDate, Math.max(0, y));
                        }}
                    >
                        {hours.map((hour) => (<div key={hour} className="hour-slot" />))}
                        {renderAvailableSlotsDay(currentDate)}
                        {dayEvents.map((event) => renderEventItem(event, currentDate))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="simple-calendar">
            <style>{generateEventStyles()}</style>
            {isLoading && (
                <div className="calendar-loading-overlay">
                    <div className="calendar-loading-content">
                        <div className="calendar-loading-spinner"></div>
                        <p className="calendar-loading-text">Guardando cambios...</p>
                    </div>
                </div>
            )}
            {creationError && (
                <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#ff4444', color: 'white', padding: '12px 20px', borderRadius: '4px', zIndex: 10000, boxShadow: '0 2px 10px rgba(0,0,0,0.2)', maxWidth: '400px', textAlign: 'center' }}>
                    ⚠️ {creationError}
                </div>
            )}
            <div className="calendar-header">
                <div className="view-controls">
                    <button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Mes</button>
                    <button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Semana</button>
                    <button className={view === "day" ? "active" : ""} onClick={() => setView("day")}>Día</button>
                </div>
                <div className="navigation-controls">
                    <button onClick={goPrev}>{"<"}</button>
                    <h2>
                        {view === "week"
                            ? `Semana del ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d MMM", { locale: es })} al ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "d MMM yyyy", { locale: es })}`
                            : format(currentDate, view === "day" ? "EEEE, d 'de' MMMM yyyy" : "MMMM yyyy", { locale: es })}
                    </h2>
                    <button onClick={goNext}>{">"}</button>
                </div>
                <button className="today-btn" onClick={() => setCurrentDate(new Date())}>Hoy</button>
            </div>
            <div className="calendar-view">
                {view === "month" && renderMonthView()}
                {view === "week" && renderWeekView()}
                {view === "day" && renderDayView()}
            </div>
            {(contextMenu || eventMenu) && (
                <div className="context-menu-overlay" onClick={() => { setContextMenu(null); setEventMenu(null); }} onTouchStart={() => { setContextMenu(null); setEventMenu(null); }} />
            )}
            {contextMenu && !readOnly && (
                <div ref={contextMenuRef} className={`context-menu ${isMobile ? 'mobile-context-menu' : ''}`} style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 10001 }} onClick={(e) => e.stopPropagation()}>
                    <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                        {eventTypes.map((eventType) => (<option key={eventType.id} value={eventType.id}>{eventType.name}</option>))}
                    </select>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', padding: '4px' }}>{getEventTypeConfig(newType).description}</div>
                    <div style={{ padding: "8px", cursor: "pointer" }} onClick={() => { handleCreateEvent(contextMenu.date, newType); setContextMenu(null); }}>
                        ➕ Agregar {isLoadingEvent === `temp-${Date.now()}` ? "..." : ""}
                    </div>
                </div>
            )}
            {eventMenu && !readOnly && (
                <div ref={eventMenuRef} className={`context-menu ${isMobile ? 'mobile-context-menu' : ''}`} style={{ position: 'fixed', left: eventMenu.x, top: eventMenu.y, zIndex: 10001 }} onClick={(e) => e.stopPropagation()}>
                    {(eventMenu.event.isConfirmed || eventMenu.event.status === 'confirmed') && (
                        <div style={{ fontSize: '11px', color: '#4CAF50', marginBottom: '8px', padding: '4px', background: '#f0f9f0', borderRadius: '3px', borderLeft: '2px solid #4CAF50' }}>✓ Turno confirmado</div>
                    )}
                    <input type="text" value={eventMenu.event.summary} onChange={(e) => handleEventUpdate(eventMenu.event.id, { summary: e.target.value })} disabled={eventMenu.event.isConfirmed || eventMenu.event.status === 'confirmed'} />
                    <select value={eventMenu.event.eventType} onChange={(e) => handleEventUpdate(eventMenu.event.id, { eventType: e.target.value })} disabled={eventMenu.event.isConfirmed || eventMenu.event.status === 'confirmed'}>
                        {eventTypes.map((eventType) => (<option key={eventType.id} value={eventType.id}>{eventType.name}</option>))}
                    </select>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', padding: '4px' }}>{getEventTypeConfig(eventMenu.event.eventType).description}</div>
                    <div style={{ padding: "8px", cursor: eventMenu.event.isConfirmed || eventMenu.event.status === 'confirmed' ? 'not-allowed' : 'pointer', opacity: eventMenu.event.isConfirmed || eventMenu.event.status === 'confirmed' ? 0.5 : 1 }} onClick={() => { if (eventMenu.event.isConfirmed || eventMenu.event.status === 'confirmed') return; handleDeleteEvent(eventMenu.event.id); setEventMenu(null); }}>
                        🗑️ Eliminar {isLoadingEvent === eventMenu.event.id ? "..." : ""}
                    </div>
                </div>
            )}
            {dragPreview && (<div className="drag-preview" style={{ top: dragPreview.y, left: dragPreview.x }}>{dragPreview.text}</div>)}
        </div>
    );
};

export default SimpleCalendar;
