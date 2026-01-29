export interface Schedule {
    id: number;
    professionalId: number;
    dayOfWeek: number;
    date: string | null;
    startTime: string;
    endTime: string;
    duration: number;
    recurring: boolean;
    color: string;
    borderColor: string;
    note: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface SchedulesResponse {
    data: Schedule[];
}

export interface CreateScheduleRequest {
    professionalId: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    duration: number;
    recurring: boolean;
    color?: string;
    borderColor?: string;
    note?: string;
}

export interface EventType {
    id: string;
    name: string;
    description: string;
    color: string;
    textColor: string;
}

export interface EventTypesResponse {
    success: boolean;
    data: {
        eventTypes: EventType[];
    };
}

export interface Professional {
    id: number;
    first_name: string;
    last_name: string;
}

export interface ProfessionalsResponse {
    success: boolean;
    data: Professional[];
}
