import { apiClient } from "@/config/apiClient";

export interface MealPlanSummary {
    userObjective: any;
    patientObjective: string | null;
    consultationDates: {
        first: string | null;
        last: string | null;
    };
    dailyIntake: any | null;
    selectedDate: string;
}

export const mealPlanService = {
    getSummary: async (userId: string | number, date?: string): Promise<MealPlanSummary> => {
        const response = await apiClient.get<{ success: boolean; data: MealPlanSummary }>(
            '/daylis/meal-plan-summary',
            { params: { userId, date } }
        );
        return response.data.data;
    },
    getDatesWithData: async (userId: string | number): Promise<string[]> => {
        const response = await apiClient.get<{ success: boolean; data: string[] }>(
            '/daylis/dates-with-data',
            { params: { userId } }
        );
        return response.data.data;
    },
    addFood: async (data: { type: string; product: any; userId?: string | number; date?: string }) => {
        const response = await apiClient.post('/api/daily/addfood', data, { params: { date: data.date } });
        return response.data.data;
    },
    updateFood: async (data: { type: string; old_type: string; product: any; userId?: string | number; date?: string }) => {
        const response = await apiClient.post('/api/daily/updatefood', data, { params: { date: data.date } });
        return response.data.data;
    },
    removeFood: async (data: { type: string; product: any; userId?: string | number; date?: string }) => {
        const response = await apiClient.post('/api/daily/removefood', data, { params: { date: data.date } });
        return response.data.data;
    },
    addRecipe: async (data: { type: string; recipeId: number | string; unit: string | number; userId?: string | number; date?: string }) => {
        const response = await apiClient.post('/api/daily/addrecipe', data);
        return response.data.data;
    },
    deleteRecipe: async (data: { type: string; recipeId: number | string; date?: string; userId?: string | number }) => {
        const response = await apiClient.post('/api/daily/deleterecipe', data);
        return response.data.data;
    }
};
