import { apiClient } from "@/config/apiClient";

export interface Food {
    id: number;
    name: string;
    kcals: number | string;
    cho: number | string;
    protein: number | string;
    lip: number | string;
    sodium?: number | string;
    fiber?: number | string;
    saturated_fat?: number | string;
    mono_unsaturated_fat?: number | string;
}

export interface Recipe {
    id: number;
    name: string;
    kcals: number | string;
    cho: number | string;
    protein: number | string;
    lip: number | string;
    description?: string;
    steps?: string[];
}

export const foodRecipeService = {
    searchFoods: async (search: string) => {
        const response = await apiClient.get('/api/foods/search', { params: { search, items_per_page: 50 } });
        return response.data;
    },
    searchRecipes: async (search: string, userId?: string) => {
        const response = await apiClient.get('/api/recipes/recipes-by-user-plan', { 
            params: { 
                search, 
                userId,
                items_per_page: 50,
                page: 1
            } 
        });
        return response.data;
    }
};
