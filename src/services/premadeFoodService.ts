import { apiClient } from "@/config/apiClient";

export interface PremadeFoodItem {
    id: number;
    grams: number;
    units: number;
    unitsName: string;
    foodId: number;
    food: any;
}

export interface OmitPremadeFoods {
    id: number;
    grams: number;
    foodId: number;
    food: any;
}

export interface PremadeMeal {
    id: number;
    name: string;
    kcalsFrom: number | string;
    kcalsTo: number | string;
    partofday: string[];
    premadefoods: PremadeFoodItem[];
}

export const premadeFoodService = {
    searchPremadeMeals: async (search: string) => {
        const response = await apiClient.get('/foods/premade/query', { 
            params: { 
                name: search, // The backend expects 'name' parameter for like search
                items_per_page: 50,
                page: 1
            } 
        });
        return response.data;
    }
};
