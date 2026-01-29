import type { Specialization, ProfessionalArea, PaginatedResponse } from "@/types/Specialization";

// Mock Data
let professionalAreas: ProfessionalArea[] = [
    { id: 1, name: "Nutrición Clínica" },
    { id: 2, name: "Nutrición Deportiva" },
    { id: 3, name: "Nutrición Pediátrica" },
];

let specializations: Specialization[] = [
    {
        id: 1,
        name: "Pérdida de Peso",
        description: "Especialización enfocada en la pérdida de peso saludable.",
        image: "https://images.unsplash.com/photo-1576402187878-974f70c890a5?w=150&h=150&fit=crop",
        professional_area_id: 1,
        status: "active",
        createdAt: new Date().toISOString(),
        ProfessionalArea: professionalAreas[0]
    },
    {
        id: 2,
        name: "Hipertrofia",
        description: "Aumento de masa muscular.",
        image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=150&h=150&fit=crop",
        professional_area_id: 2,
        status: "active",
        createdAt: new Date().toISOString(),
        ProfessionalArea: professionalAreas[1]
    }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const MockApi = {
    getProfessionalAreas: async (): Promise<{ data: ProfessionalArea[] }> => {
        await delay(500);
        return { data: professionalAreas };
    },

    getSpecializations: async (params: { page: number; items_per_page: number; search: string; professional_area_id?: string }): Promise<PaginatedResponse<Specialization>> => {
        await delay(800);
        let filtered = [...specializations];

        if (params.search) {
            filtered = filtered.filter(s => s.name.toLowerCase().includes(params.search.toLowerCase()));
        }

        if (params.professional_area_id) {
            filtered = filtered.filter(s => s.professional_area_id === Number(params.professional_area_id));
        }

        const start = (params.page - 1) * params.items_per_page;
        const end = start + params.items_per_page;
        const paged = filtered.slice(start, end);

        return {
            data: paged,
            payload: {
                pagination: {
                    total: filtered.length,
                    per_page: params.items_per_page,
                    current_page: params.page,
                    last_page: Math.ceil(filtered.length / params.items_per_page)
                }
            }
        };
    },

    addSpecialization: async (data: any): Promise<Specialization> => {
        await delay(1000);
        const area = professionalAreas.find(p => p.id == data.professional_area_id);
        const newSpec: Specialization = {
            id: Math.floor(Math.random() * 10000),
            ...data,
            createdAt: new Date().toISOString(),
            ProfessionalArea: area
        };
        specializations = [newSpec, ...specializations];
        return newSpec;
    },

    updateSpecialization: async (data: any): Promise<Specialization> => {
        await delay(1000);
        const index = specializations.findIndex(s => s.id === data.id);
        if (index !== -1) {
            const area = professionalAreas.find(p => p.id == data.professional_area_id);
            specializations[index] = { ...specializations[index], ...data, ProfessionalArea: area };
            return specializations[index];
        }
        throw new Error("Specialization not found");
    },

    deleteSpecialization: async (id: number): Promise<void> => {
        await delay(1000);
        specializations = specializations.filter(s => s.id !== id);
    }
};
