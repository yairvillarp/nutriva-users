export interface CalEventDateTime {
    dateTime: string;
    timeZone?: string;
}

export interface CalEvent {
    id: string;
    summary: string;
    description?: string;
    start: CalEventDateTime;
    end: CalEventDateTime;
    colorId?: string;
    eventType: string;
    professionalId?: string;
    patientId?: string;
    phone?: string;
    email?: string;
    isConfirmed?: boolean;
    status?: string;
    patient?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
    };
    professional?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
    };
}

export interface CreateAppointmentRequest {
    appointment: CalEvent;
}

export interface CreateAppointmentsRequest {
    appointments: CalEvent[];
}

export interface UpdateAppointmentRequest {
    id: string;
    updates: Partial<CalEvent>;
}

export interface AppointmentsResponse {
    success: boolean;
    data: CalEvent[];
    payload?: {
        pagination?: {
            page: number;
            items_per_page: number;
            total: number;
            total_pages: number;
        };
    };
}

export interface AppointmentResponse {
    success: boolean;
    data: CalEvent;
}

export interface AppointmentStats {
    stats: Array<{
        status: string;
        count: number;
    }>;
    total: number;
}

export interface AppointmentStatsResponse {
    success: boolean;
    data: AppointmentStats;
}
