import type { User } from "./user";

export interface Specialization {
    id: number;
    name: string;
    professional_area_id: number;
    ProfessionalArea?: {
        id: number;
        name: string;
    };
}

export interface Patient extends User {
    specializations: Specialization[];
    hasOnboard: boolean;
    type_profile?: string;
    occupation?: string;
    country?: string;
}

export interface PatientPagination {
    total_items: number;
    total_pages: number;
    current_page: number;
    items_per_page: number;
}

export interface PatientQueryResponse {
    data: Patient[];
    all_user_ids: number[];
    payload: {
        pagination: PatientPagination;
    };
}
