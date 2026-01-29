export interface ProfessionalArea {
    id: number;
    name: string;
}

export interface Specialization {
    id: number;
    name: string;
    description: string;
    image: string;
    professional_area_id: number;
    status: 'active' | 'inactive';
    createdAt: string;
    ProfessionalArea?: ProfessionalArea;
}

export interface SpecializationFormData {
    name: string;
    description: string;
    image: string;
    professional_area_id?: number;
    status: 'active' | 'inactive';
}

export interface PaginationData {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    payload: {
        pagination: PaginationData;
    };
}
